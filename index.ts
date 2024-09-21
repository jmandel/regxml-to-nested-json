import { DOMParser, XMLSerializer } from 'xmldom';
import fs from 'fs';

interface OutputNode {
  title: string;
  path: number[];
  content: string[]; // Now stores XML strings
}

const xmlData = fs.readFileSync('input.xml', 'utf8');
const parser = new DOMParser();
const doc = parser.parseFromString(xmlData, 'text/xml');

const suplinf = doc.getElementsByTagName('SUPLINF')[0];

function createFlatOutline(element: Element): OutputNode[] {
  const outline: OutputNode[] = [];
  let currentNode: OutputNode | null = null;
  let currentPath: number[] = [];
  let preambleNode: OutputNode | null = null;
  const serializer = new XMLSerializer(); 

  function isValidHeader(header: string): boolean {
    const headerRegex = /^([A-Za-z0-9]{1,5})\./;
    return headerRegex.test(header);
  }

  function convertToIndex(value: string, level: number): number {
    value = value.replace(/\.$/, '');

    switch (level) {
      case 1: return romanToArabic(value.toUpperCase());
      case 2: return value.charCodeAt(0) - 64; 
      case 3: return parseInt(value);
      case 4: return value.charCodeAt(0) - 96; 
      case 5: return romanToArabic(value.toLowerCase());
      default: throw new Error(`Invalid level: ${level}`);
    }
  }

  function romanToArabic(roman: string): number {
    const romanNumerals: { [key: string]: number } = {
      i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000,
      I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
    };
    let result = 0;
    for (let i = 0; i < roman.length; i++) {
      const current = romanNumerals[roman[i]];
      const next = romanNumerals[roman[i + 1]];
      if (next && next > current) {
        result -= current;
      } else {
        result += current;
      }
    }
    return result;
  }

  function isValidSuccessor(currentPath: number[], nextTitle: string): { isValid: boolean; newLevel: number } {
    console.warn(`Checking valid successor: currentPath = [${currentPath}], nextTitle = "${nextTitle}"`);
    const currentLevel = currentPath.length;
    const headerPart = nextTitle.split(' ')[0].replace(/\.$/, '');

    try {
      const index = convertToIndex(headerPart, currentLevel + 1);
      if (index === 1) {
        console.warn(`Valid successor at level ${currentLevel + 1}`);
        return { isValid: true, newLevel: currentLevel + 1 };
      }
    } catch (e) {
    }

    for (let checkLevel = currentLevel; checkLevel > 0; checkLevel--) {
      try {
        const index = convertToIndex(headerPart, checkLevel);
        if (checkLevel === currentLevel) {
          if (index === currentPath[checkLevel - 1] + 1) {
            console.warn(`Valid successor at level ${checkLevel}`);
            return { isValid: true, newLevel: checkLevel };
          }
        } else {
          if (index === currentPath[checkLevel - 1] + 1) {
            console.warn(`Valid successor at level ${checkLevel}`);
            return { isValid: true, newLevel: checkLevel };
          }
        }
      } catch (e) {
      }
    }

    console.warn(`Invalid successor`);
    return { isValid: false, newLevel: -1 };
  }

  let reachedLSTSUB = false;
  let finalSection: OutputNode | null = null;

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === child.ELEMENT_NODE) {
      const el = child as Element;

      if (el.tagName === 'LSTSUB') {
        reachedLSTSUB = true;
        finalSection = {
          title: "Final Section",
          path: [currentPath[0] + 1],
          content: []
        };
        outline.push(finalSection);
        currentNode = finalSection;
        continue;
      }

      if (reachedLSTSUB) {
        if (finalSection) {
          finalSection.content.push(serializer.serializeToString(el));
        }
        continue;
      }

      if (el.tagName === 'HD') {
        const hdContent = el.textContent?.trim() || '';
        const source = el.getAttribute('SOURCE') || '';
        console.warn(`Processing HD element: content="${hdContent}", source="${source}"`);

        if (!['HD1', 'HD2', 'HD3'].includes(source)) {
          console.warn(`Ignoring HD element with invalid source: ${source}`);
          continue; // Skip to the next child
        }

        const headerPart = hdContent?.split(' ')?.[0];
        if (!isValidHeader(headerPart)) {
          console.warn(`Ignoring HD element with invalid header: ${headerPart}`);
          continue; // Skip to the next child
        }

        if (source === 'HD1' && !preambleNode) {
          preambleNode = {
            title: "Preamble",
            path: [0],
            content: []
          };
          outline.push(preambleNode);
        }

        const { isValid, newLevel } = isValidSuccessor(currentPath, hdContent);

        if (isValid) {
          if (currentNode) {
          }

          const titleIndex = convertToIndex(headerPart, newLevel);

          if (newLevel === 1) {
            currentPath = [titleIndex];
          } else {
            while (currentPath.length >= newLevel) {
              currentPath.pop();
            }
            currentPath.push(titleIndex);
          }
          console.warn(`Updated current path: [${currentPath}]`);

          const newNode: OutputNode = {
            title: hdContent,
            path: [...currentPath],
            content: []
          };

          outline.push(newNode);
          currentNode = newNode;
        } else {
          if (currentNode) {
            currentNode.content.push(serializer.serializeToString(el));
          } else if (preambleNode) {
            preambleNode.content.push(serializer.serializeToString(el));
          }
        }
      } else {
        if (currentNode) {
          currentNode.content.push(serializer.serializeToString(el));
        } else if (preambleNode) {
          preambleNode.content.push(serializer.serializeToString(el));
        }
      }
    }
  }

  if (!preambleNode) {
    preambleNode = {
      title: "Preamble",
      path: [0],
      content: Array.from(element.childNodes).map(child => 
        child.nodeType === child.ELEMENT_NODE ? serializer.serializeToString(child as Element) : ''
      )
    };
    outline.unshift(preambleNode);
  }

  return outline;
}

function writeJsonToFile(data: any, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonString, 'utf8');
}
const flatOutline = createFlatOutline(suplinf);
writeJsonToFile(flatOutline, 'output.json');

// const flatOutline = createFlatOutline(suplinf);
// console.log(JSON.stringify(flatOutline, null, 2));
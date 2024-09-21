# XML Outline Parser

## Purpose

This XML Outline Parser is designed to process structured XML documents, particularly those containing hierarchical sections like legal documents, technical specifications, or complex reports. It converts the XML structure into a JSON outline, preserving the hierarchical relationships and content of the document.

## Key Features

1. Parses XML documents with nested section headings (up to 5 levels deep).
2. Handles various numbering systems:
   - Level 1: Uppercase Roman numerals (I, II, III, ...)
   - Level 2: Uppercase letters (A, B, C, ...)
   - Level 3: Arabic numerals (1, 2, 3, ...)
   - Level 4: Lowercase letters (a, b, c, ...)
   - Level 5: Lowercase Roman numerals (i, ii, iii, ...)
3. Maintains the hierarchical structure of the document.
4. Preserves content associated with each section.
5. Performs validation to ensure correct document structure.

## How It Works

### 1. XML Parsing

The program uses the `fast-xml-parser` library to convert the XML document into a JavaScript object. This object retains the structure and attributes of the original XML.

### 2. Outline Creation

The `createOutline` function is the core of the parser. It recursively processes the parsed XML object to build the outline structure.

### 3. Section Handling

- The parser identifies section headings using the `HD` tag in the XML.
- Each heading's level is determined by its `SOURCE` attribute (e.g., "HD1", "HD2").
- The heading text is parsed to extract the section number or letter.

### 4. Numbering Conversion

The `convertToIndex` function translates various numbering systems into numeric indices:
- It handles different numbering systems based on the section level.
- Roman numerals (both uppercase and lowercase) are converted using the `romanToArabic` function.

### 5. Hierarchy Validation

The `isValidSuccessor` function ensures that the document structure is valid:
- It checks if a new section is a valid successor to the current section.
- It prevents invalid transitions (e.g., skipping levels).

### 6. Content Association

- Content between headings (typically in `P` tags) is associated with the current section.
- This content is stored in the `content` array of each outline node.

### 7. Output Generation

The parser produces a JSON structure where each node represents a section and contains:
- The section title
- A numeric path representing its position in the hierarchy
- Associated content
- Child sections (if any)

## Usage

1. Ensure you have Node.js and Bun installed.
2. Install dependencies:
   ```
   bun add fast-xml-parser
   bun add -d @types/node
   ```
3. Place your XML file in the same directory as the script, named `input.xml`.
4. Run the script:
   ```
   bun run index.ts
   ```
5. The parsed outline will be output to the console. Optionally, uncomment the last line to save the output to a file.

## Debugging

The current version includes extensive console logging for debugging purposes. These logs help track the parsing process and identify any issues with input processing or structural validation.

## Future Improvements

- Enhanced error handling and reporting
- Support for more complex document structures
- Options for customizing output format
- Command-line interface for easier usage
- Unit tests to ensure reliability

## Contributing

Contributions to improve the parser are welcome. Please ensure that any pull requests include appropriate tests and documentation updates.

import { parseBlocks } from "./block-parser.ts";
import {
   type BlockNodeType,
   type InlineNodeType,
   type MarkdownDocument,
   type ParseOptions,
   parseOptionsSchema,
} from "./schemas.ts";
import type { ParseResult } from "./types.ts";
import { decodeBuffer, detectLineEnding, normalizeLineEndings } from "./utils.ts";

// Union type for any node in the AST
type AnyNode =
   | MarkdownDocument["root"]
   | BlockNodeType
   | InlineNodeType;

// =============================================================================
// Public API
// =============================================================================

/**
 * Parses markdown content and returns a result object.
 *
 * @param content - The markdown string to parse
 * @param options - Parsing options
 * @returns A ParseResult containing either the parsed document or an error
 *
 * @example
 * ```typescript
 * const result = parse("# Hello World");
 * if (result.success) {
 *   console.log(result.data.root.children);
 * }
 * ```
 */
export function parse(
   content: string,
   options?: ParseOptions,
): ParseResult<MarkdownDocument> {
   try {
      const data = parseOrThrow(content, options);
      return { success: true, data };
   } catch (error) {
      return {
         success: false,
         error: error instanceof Error ? error : new Error(String(error)),
      };
   }
}

/**
 * Parses markdown content and throws on error.
 *
 * @param content - The markdown string to parse
 * @param options - Parsing options
 * @returns The parsed markdown document
 * @throws Error if parsing fails or options are invalid
 *
 * @example
 * ```typescript
 * const doc = parseOrThrow("# Hello World");
 * console.log(doc.root.children);
 * ```
 */
export function parseOrThrow(
   content: string,
   options?: ParseOptions,
): MarkdownDocument {
   // Validate options if provided
   if (options !== undefined) {
      parseOptionsSchema.parse(options);
   }

   const includePositions = options?.positions ?? true;
   const preserveSource = options?.preserveSource ?? false;

   // Handle empty content
   if (!content || content.trim() === "") {
      return {
         root: {
            type: "document",
            children: [],
            references: {},
         },
         lineEnding: "\n",
      };
   }

   // Detect line ending before normalization
   const lineEnding = detectLineEnding(content);

   // Normalize line endings for parsing
   const normalized = normalizeLineEndings(content);

   // Parse blocks
   const { blocks, references } = parseBlocks(
      normalized,
      undefined,
      includePositions,
   );

   // Convert references map to object
   const referencesObj: Record<
      string,
      { type: "linkReferenceDefinition"; label: string; url: string; title?: string }
   > = {};

   for (const [label, ref] of references) {
      referencesObj[label] = {
         type: "linkReferenceDefinition",
         label,
         url: ref.url,
         title: ref.title,
      };
   }

   const document: MarkdownDocument = {
      root: {
         type: "document",
         children: blocks,
         references: Object.keys(referencesObj).length > 0 ? referencesObj : undefined,
      },
      lineEnding,
   };

   if (preserveSource) {
      document.source = content;
   }

   return document;
}

/**
 * Parses markdown from a buffer with automatic encoding detection.
 *
 * @param buffer - The buffer containing markdown data
 * @param options - Parsing options
 * @returns A ParseResult containing either the parsed document or an error
 *
 * @example
 * ```typescript
 * const buffer = new Uint8Array([...]);
 * const result = parseBuffer(buffer);
 * if (result.success) {
 *   console.log(result.data.root.children);
 * }
 * ```
 */
export function parseBuffer(
   buffer: Uint8Array,
   options?: ParseOptions,
): ParseResult<MarkdownDocument> {
   try {
      const data = parseBufferOrThrow(buffer, options);
      return { success: true, data };
   } catch (error) {
      return {
         success: false,
         error: error instanceof Error ? error : new Error(String(error)),
      };
   }
}

/**
 * Parses markdown from a buffer with automatic encoding detection.
 * Throws on error.
 *
 * @param buffer - The buffer containing markdown data
 * @param options - Parsing options
 * @returns The parsed markdown document
 * @throws Error if parsing fails
 *
 * @example
 * ```typescript
 * const buffer = new Uint8Array([...]);
 * const doc = parseBufferOrThrow(buffer);
 * console.log(doc.root.children);
 * ```
 */
export function parseBufferOrThrow(
   buffer: Uint8Array,
   options?: ParseOptions,
): MarkdownDocument {
   const content = decodeBuffer(buffer);
   return parseOrThrow(content, options);
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Parses markdown and returns just the AST root node.
 *
 * @param content - The markdown string to parse
 * @param options - Parsing options
 * @returns The root document node
 *
 * @example
 * ```typescript
 * const root = parseToAst("# Hello");
 * console.log(root.type); // "document"
 * ```
 */
export function parseToAst(
   content: string,
   options?: ParseOptions,
): MarkdownDocument["root"] {
   return parseOrThrow(content, options).root;
}

/**
 * Checks if the given content is valid markdown (doesn't throw during parsing).
 *
 * @param content - The content to check
 * @returns True if the content can be parsed as markdown
 *
 * @example
 * ```typescript
 * isValidMarkdown("# Hello"); // true
 * isValidMarkdown("anything"); // true (markdown is very permissive)
 * ```
 */
export function isValidMarkdown(content: string): boolean {
   const result = parse(content);
   return result.success;
}

/**
 * Extracts all text content from a markdown document (strips formatting).
 *
 * @param content - The markdown string
 * @returns Plain text content
 *
 * @example
 * ```typescript
 * extractText("**Hello** *world*"); // "Hello world"
 * ```
 */
export function extractText(content: string): string {
   const doc = parseOrThrow(content, { positions: false });
   return extractTextFromNode(doc.root);
}

/**
 * Recursively extracts text from a node.
 */
function extractTextFromNode(node: AnyNode): string {
   if ("value" in node && typeof node.value === "string") {
      return node.value;
   }

   if ("children" in node && Array.isArray(node.children)) {
      return (node.children as AnyNode[]).map(extractTextFromNode).join("");
   }

   if (node.type === "softBreak") {
      return " ";
   }

   if (node.type === "hardBreak") {
      return "\n";
   }

   return "";
}

/**
 * Counts the number of words in a markdown document.
 *
 * @param content - The markdown string
 * @returns Word count
 *
 * @example
 * ```typescript
 * countWords("Hello **world**!"); // 2
 * ```
 */
export function countWords(content: string): number {
   const text = extractText(content);
   const words = text.trim().split(/\s+/).filter(Boolean);
   return words.length;
}

/**
 * Gets headings from a markdown document.
 *
 * @param content - The markdown string
 * @returns Array of heading info
 *
 * @example
 * ```typescript
 * getHeadings("# Title\n## Section");
 * // [{ level: 1, text: "Title" }, { level: 2, text: "Section" }]
 * ```
 */
export function getHeadings(
   content: string,
): Array<{ level: number; text: string }> {
   const doc = parseOrThrow(content, { positions: false });
   const headings: Array<{ level: number; text: string }> = [];

   function visit(node: AnyNode): void {
      if (node.type === "heading") {
         const text = (node.children as AnyNode[]).map(extractTextFromNode).join("");
         headings.push({ level: node.level, text });
      }

      if ("children" in node && Array.isArray(node.children)) {
         for (const child of node.children as AnyNode[]) {
            visit(child);
         }
      }
   }

   visit(doc.root);
   return headings;
}

/**
 * Gets all links from a markdown document.
 *
 * @param content - The markdown string
 * @returns Array of link info
 *
 * @example
 * ```typescript
 * getLinks("[Example](https://example.com)");
 * // [{ text: "Example", url: "https://example.com" }]
 * ```
 */
export function getLinks(
   content: string,
): Array<{ text: string; url: string; title?: string }> {
   const doc = parseOrThrow(content, { positions: false });
   const links: Array<{ text: string; url: string; title?: string }> = [];

   function visit(node: AnyNode): void {
      if (node.type === "link") {
         const text = (node.children as AnyNode[]).map(extractTextFromNode).join("");
         links.push({ text, url: node.url, title: node.title });
      }

      if ("children" in node && Array.isArray(node.children)) {
         for (const child of node.children as AnyNode[]) {
            visit(child);
         }
      }
   }

   visit(doc.root);
   return links;
}

/**
 * Gets all images from a markdown document.
 *
 * @param content - The markdown string
 * @returns Array of image info
 *
 * @example
 * ```typescript
 * getImages("![Alt text](image.png)");
 * // [{ alt: "Alt text", url: "image.png" }]
 * ```
 */
export function getImages(
   content: string,
): Array<{ alt: string; url: string; title?: string }> {
   const doc = parseOrThrow(content, { positions: false });
   const images: Array<{ alt: string; url: string; title?: string }> = [];

   function visit(node: AnyNode): void {
      if (node.type === "image") {
         images.push({ alt: node.alt, url: node.url, title: node.title });
      }

      if ("children" in node && Array.isArray(node.children)) {
         for (const child of node.children as AnyNode[]) {
            visit(child);
         }
      }
   }

   visit(doc.root);
   return images;
}

/**
 * Gets all code blocks from a markdown document.
 *
 * @param content - The markdown string
 * @returns Array of code block info
 *
 * @example
 * ```typescript
 * getCodeBlocks("```js\nconsole.log('hi');\n```");
 * // [{ lang: "js", code: "console.log('hi');" }]
 * ```
 */
export function getCodeBlocks(
   content: string,
): Array<{ lang?: string; code: string }> {
   const doc = parseOrThrow(content, { positions: false });
   const codeBlocks: Array<{ lang?: string; code: string }> = [];

   function visit(node: AnyNode): void {
      if (node.type === "codeBlock") {
         codeBlocks.push({ lang: node.lang, code: node.value });
      }

      if ("children" in node && Array.isArray(node.children)) {
         for (const child of node.children as AnyNode[]) {
            visit(child);
         }
      }
   }

   visit(doc.root);
   return codeBlocks;
}

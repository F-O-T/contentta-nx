import type { EncodingInfo, LineInfo } from "./types.ts";

// =============================================================================
// Encoding Detection
// =============================================================================

/**
 * Detects if the buffer starts with a BOM and returns the encoding.
 *
 * @param buffer - The buffer to check
 * @returns The encoding info with BOM length
 */
export function detectEncoding(buffer: Uint8Array): EncodingInfo {
   // UTF-8 BOM: EF BB BF
   if (
      buffer.length >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
   ) {
      return { encoding: "utf-8", bomLength: 3 };
   }

   // UTF-16 LE BOM: FF FE
   if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return { encoding: "utf-16le", bomLength: 2 };
   }

   // UTF-16 BE BOM: FE FF
   if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return { encoding: "utf-16be", bomLength: 2 };
   }

   // Default to UTF-8
   return { encoding: "utf-8", bomLength: 0 };
}

/**
 * Decodes a buffer to string with the appropriate encoding.
 *
 * @param buffer - The buffer to decode
 * @returns The decoded string
 */
export function decodeBuffer(buffer: Uint8Array): string {
   const { encoding, bomLength } = detectEncoding(buffer);
   const data = bomLength > 0 ? buffer.slice(bomLength) : buffer;
   // TextDecoder accepts utf-8, utf-16le, and utf-16be at runtime
   // biome-ignore lint/suspicious/noExplicitAny: TextDecoder runtime supports more encodings than TypeScript types
   const decoder = new TextDecoder(encoding as any);
   return decoder.decode(data);
}

// =============================================================================
// Line Ending Detection
// =============================================================================

/**
 * Detects the line ending style used in the content.
 *
 * @param content - The content to analyze
 * @returns The detected line ending
 */
export function detectLineEnding(content: string): "\n" | "\r\n" {
   const crlfIndex = content.indexOf("\r\n");
   const lfIndex = content.indexOf("\n");

   // If CRLF is found and appears before or at same position as LF
   if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex <= lfIndex)) {
      return "\r\n";
   }

   return "\n";
}

/**
 * Normalizes line endings to LF.
 *
 * @param content - The content to normalize
 * @returns The content with normalized line endings
 */
export function normalizeLineEndings(content: string): string {
   return content.replace(/\r\n?/g, "\n");
}

// =============================================================================
// Line Parsing
// =============================================================================

/**
 * Splits content into lines with metadata.
 *
 * @param content - The content to split
 * @returns Array of line info objects
 */
export function splitLines(content: string): LineInfo[] {
   const normalized = normalizeLineEndings(content);
   const rawLines = normalized.split("\n");

   return rawLines.map((raw, index) => {
      const indent = countIndent(raw);
      const content = raw.slice(indent);

      return {
         raw,
         content,
         indent,
         lineNumber: index + 1,
         isBlank: content.length === 0,
      };
   });
}

/**
 * Counts the number of leading spaces in a string.
 * Tabs are expanded to 4 spaces.
 *
 * @param line - The line to check
 * @returns The indent level (in spaces)
 */
export function countIndent(line: string): number {
   let indent = 0;
   for (const char of line) {
      if (char === " ") {
         indent++;
      } else if (char === "\t") {
         // Tab stops at multiples of 4
         indent = Math.ceil((indent + 1) / 4) * 4;
      } else {
         break;
      }
   }
   return indent;
}

/**
 * Removes a specific amount of indentation from a line.
 *
 * @param line - The line to process
 * @param amount - The amount of indentation to remove
 * @returns The line with indentation removed
 */
export function removeIndent(line: string, amount: number): string {
   let removed = 0;
   let i = 0;

   while (i < line.length && removed < amount) {
      const char = line[i];
      if (char === " ") {
         removed++;
         i++;
      } else if (char === "\t") {
         const tabWidth = 4 - (removed % 4);
         if (removed + tabWidth <= amount) {
            removed += tabWidth;
            i++;
         } else {
            // Partial tab - add spaces to make up the difference
            const spaces = amount - removed;
            return " ".repeat(tabWidth - spaces) + line.slice(i + 1);
         }
      } else {
         break;
      }
   }

   return line.slice(i);
}

/**
 * Checks if a line is blank (only whitespace).
 *
 * @param line - The line to check
 * @returns True if the line is blank
 */
export function isBlankLine(line: string): boolean {
   return /^[ \t]*$/.test(line);
}

// =============================================================================
// Markdown Escaping
// =============================================================================

/**
 * Characters that need escaping in markdown.
 */
const ESCAPE_CHARS = /[\\`*_{}[\]()#+\-.!<>|]/g;

/**
 * Escapes special markdown characters.
 *
 * @param text - The text to escape
 * @returns The escaped text
 */
export function escapeMarkdown(text: string): string {
   return text.replace(ESCAPE_CHARS, "\\$&");
}

/**
 * Characters that can be escaped in markdown.
 */
const ESCAPABLE = "\\!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~";

/**
 * Unescapes backslash-escaped characters in markdown.
 *
 * @param text - The text to unescape
 * @returns The unescaped text
 */
export function unescapeMarkdown(text: string): string {
   let result = "";
   let i = 0;

   while (i < text.length) {
      if (text[i] === "\\" && i + 1 < text.length) {
         const nextChar = text[i + 1];
         if (nextChar && ESCAPABLE.includes(nextChar)) {
            result += nextChar;
            i += 2;
            continue;
         }
      }
      result += text[i];
      i++;
   }

   return result;
}

// =============================================================================
// Entity Handling
// =============================================================================

/**
 * HTML entity map for decoding.
 */
const HTML_ENTITIES: Record<string, string> = {
   "&amp;": "&",
   "&lt;": "<",
   "&gt;": ">",
   "&quot;": '"',
   "&apos;": "'",
   "&nbsp;": "\u00A0",
   "&copy;": "\u00A9",
   "&reg;": "\u00AE",
   "&trade;": "\u2122",
   "&mdash;": "\u2014",
   "&ndash;": "\u2013",
   "&hellip;": "\u2026",
   "&lsquo;": "\u2018",
   "&rsquo;": "\u2019",
   "&ldquo;": "\u201C",
   "&rdquo;": "\u201D",
};

/**
 * Decodes HTML entities in text.
 *
 * @param text - The text to decode
 * @returns The decoded text
 */
export function decodeHtmlEntities(text: string): string {
   // Named entities
   let result = text.replace(/&[a-zA-Z]+;/g, (match) => {
      return HTML_ENTITIES[match] ?? match;
   });

   // Numeric entities (decimal)
   result = result.replace(/&#(\d+);/g, (_, code) => {
      const num = Number.parseInt(code, 10);
      return num > 0 && num < 0x10ffff ? String.fromCodePoint(num) : _;
   });

   // Numeric entities (hex)
   result = result.replace(/&#[xX]([0-9a-fA-F]+);/g, (_, code) => {
      const num = Number.parseInt(code, 16);
      return num > 0 && num < 0x10ffff ? String.fromCodePoint(num) : _;
   });

   return result;
}

/**
 * Encodes special HTML characters.
 *
 * @param text - The text to encode
 * @returns The encoded text
 */
export function encodeHtmlEntities(text: string): string {
   return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
}

// =============================================================================
// URL Handling
// =============================================================================

/**
 * Encodes a URL for safe use in markdown.
 *
 * @param url - The URL to encode
 * @returns The encoded URL
 */
export function encodeUrl(url: string): string {
   // Encode parentheses and spaces which can break markdown links
   return url
      .replace(/%/g, "%25")
      .replace(/ /g, "%20")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
}

/**
 * Decodes a URL from markdown.
 *
 * @param url - The URL to decode
 * @returns The decoded URL
 */
export function decodeUrl(url: string): string {
   try {
      return decodeURIComponent(url);
   } catch {
      // Invalid encoding, return as-is
      return url;
   }
}

/**
 * Checks if a string is a valid URL.
 *
 * @param str - The string to check
 * @returns True if the string is a valid URL
 */
export function isValidUrl(str: string): boolean {
   try {
      new URL(str);
      return true;
   } catch {
      return false;
   }
}

/**
 * Checks if a string is a valid email address (simplified).
 *
 * @param str - The string to check
 * @returns True if the string looks like an email
 */
export function isValidEmail(str: string): boolean {
   // Simplified email regex - not RFC 5322 compliant but good enough for autolinks
   return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
      str,
   );
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Normalizes a link reference label.
 * Per CommonMark: case-insensitive, collapse internal whitespace.
 *
 * @param label - The label to normalize
 * @returns The normalized label
 */
export function normalizeLabel(label: string): string {
   return label
      .trim()
      .toLowerCase()
      .replace(/[\t\n\r ]+/g, " ");
}

/**
 * Repeats a string n times.
 *
 * @param str - The string to repeat
 * @param count - The number of times to repeat
 * @returns The repeated string
 */
export function repeat(str: string, count: number): string {
   return str.repeat(Math.max(0, count));
}

/**
 * Pads a string to a minimum length.
 *
 * @param str - The string to pad
 * @param length - The minimum length
 * @param char - The padding character
 * @returns The padded string
 */
export function padEnd(str: string, length: number, char = " "): string {
   if (str.length >= length) return str;
   return str + char.repeat(length - str.length);
}

// =============================================================================
// Pattern Matching
// =============================================================================

/**
 * Regex for ATX heading (# style).
 */
export const ATX_HEADING_REGEX = /^(#{1,6})(?:[ \t]+(.*))?$/;

/**
 * Regex for setext heading underline.
 */
export const SETEXT_HEADING_REGEX = /^(=+|-+)[ \t]*$/;

/**
 * Regex for thematic break (---, ***, ___).
 */
export const THEMATIC_BREAK_REGEX =
   /^(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;

/**
 * Regex for fenced code block opening.
 */
export const FENCED_CODE_OPEN_REGEX = /^(`{3,}|~{3,})[ \t]*([^`\n]*)?$/;

/**
 * Regex for ordered list item.
 */
export const ORDERED_LIST_REGEX = /^(\d{1,9})([.)])[ \t]+/;

/**
 * Regex for unordered list item.
 */
export const UNORDERED_LIST_REGEX = /^([-*+])[ \t]+/;

/**
 * Regex for blockquote.
 */
export const BLOCKQUOTE_REGEX = /^>[ \t]?/;

/**
 * Regex for link reference definition.
 */
export const LINK_REFERENCE_REGEX =
   /^\[([^\]]+)\]:[ \t]*<?([^\s>]+)>?(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?[ \t]*$/;

/**
 * Regex for autolink.
 */
export const AUTOLINK_REGEX = /^<([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s<>]*)>$/;

/**
 * Regex for email autolink.
 */
export const EMAIL_AUTOLINK_REGEX =
   /^<([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>$/;

/**
 * Regex for inline link.
 */
export const INLINE_LINK_REGEX =
   /^\[([^\]]*)\]\(([^)\s]*?)(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\)/;

/**
 * Regex for reference link.
 */
export const REFERENCE_LINK_REGEX = /^\[([^\]]*)\]\[([^\]]*)\]/;

/**
 * Regex for collapsed reference link.
 */
export const COLLAPSED_LINK_REGEX = /^\[([^\]]*)\]\[\]/;

/**
 * Regex for shortcut reference link.
 */
export const SHORTCUT_LINK_REGEX = /^\[([^\]]*)\]/;

// =============================================================================
// HTML Block Patterns (CommonMark Types 1-7)
// =============================================================================

/**
 * HTML block type 1 - Script, pre, style, textarea.
 */
export const HTML_BLOCK_1_OPEN =
   /^<(?:script|pre|style|textarea)(?:\s|>|$)/i;
export const HTML_BLOCK_1_CLOSE = /<\/(?:script|pre|style|textarea)>/i;

/**
 * HTML block type 2 - Comment.
 */
export const HTML_BLOCK_2_OPEN = /^<!--/;
export const HTML_BLOCK_2_CLOSE = /-->/;

/**
 * HTML block type 3 - Processing instruction.
 */
export const HTML_BLOCK_3_OPEN = /^<\?/;
export const HTML_BLOCK_3_CLOSE = /\?>/;

/**
 * HTML block type 4 - Declaration.
 */
export const HTML_BLOCK_4_OPEN = /^<![A-Z]/;
export const HTML_BLOCK_4_CLOSE = />/;

/**
 * HTML block type 5 - CDATA.
 */
export const HTML_BLOCK_5_OPEN = /^<!\[CDATA\[/;
export const HTML_BLOCK_5_CLOSE = /\]\]>/;

/**
 * HTML block type 6 - Standard block elements.
 */
export const HTML_BLOCK_6_OPEN =
   /^<\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|\/?>|$)/i;

/**
 * HTML block type 7 - Open tag not followed by blank line.
 */
export const HTML_BLOCK_7_OPEN =
   /^(?:<[a-zA-Z][a-zA-Z0-9-]*(?:\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*(?:\s*=\s*(?:[^"'=<>`\s]+|'[^']*'|"[^"]*"))?)*\s*\/?>|<\/[a-zA-Z][a-zA-Z0-9-]*\s*>)[ \t]*$/;

/**
 * Determines HTML block type for a line.
 *
 * @param line - The line to check
 * @returns The HTML block type (1-7) or 0 if not an HTML block
 */
export function getHtmlBlockType(line: string): number {
   if (HTML_BLOCK_1_OPEN.test(line)) return 1;
   if (HTML_BLOCK_2_OPEN.test(line)) return 2;
   if (HTML_BLOCK_3_OPEN.test(line)) return 3;
   if (HTML_BLOCK_4_OPEN.test(line)) return 4;
   if (HTML_BLOCK_5_OPEN.test(line)) return 5;
   if (HTML_BLOCK_6_OPEN.test(line)) return 6;
   if (HTML_BLOCK_7_OPEN.test(line)) return 7;
   return 0;
}

/**
 * Checks if a line closes an HTML block of the given type.
 *
 * @param line - The line to check
 * @param type - The HTML block type
 * @returns True if the line closes the block
 */
export function closesHtmlBlock(line: string, type: number): boolean {
   switch (type) {
      case 1:
         return HTML_BLOCK_1_CLOSE.test(line);
      case 2:
         return HTML_BLOCK_2_CLOSE.test(line);
      case 3:
         return HTML_BLOCK_3_CLOSE.test(line);
      case 4:
         return HTML_BLOCK_4_CLOSE.test(line);
      case 5:
         return HTML_BLOCK_5_CLOSE.test(line);
      case 6:
      case 7:
         return isBlankLine(line);
      default:
         return false;
   }
}

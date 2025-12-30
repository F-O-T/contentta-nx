/**
 * Markdown Library Types
 *
 * Most types are derived from Zod schemas in schemas.ts.
 * This file contains only types that cannot be expressed as Zod schemas.
 */

// Re-export all types from schemas (these are Zod-inferred)
export type {
   // Document types
   MarkdownDocument,
   DocumentNode,
   Position,

   // Block node types
   BlockNode,
   BlockquoteNode,
   CodeBlockNode,
   HeadingNode,
   HtmlBlockNode,
   LinkReferenceDefinition,
   ListItemNode,
   ListNode,
   ParagraphNode,
   ThematicBreakNode,

   // Inline node types
   InlineNode,
   CodeSpanNode,
   EmphasisNode,
   HardBreakNode,
   HtmlInlineNode,
   ImageNode,
   LinkNode,
   SoftBreakNode,
   StrongNode,
   TextNode,

   // Union types
   LiteralNode,
   Node,
   ParentNode,

   // Options
   GenerateOptions,
   ParseOptions,
   StreamOptions,

   // Streaming
   StreamEvent,

   // Batch processing
   BatchMarkdownFileInput,
   BatchMarkdownStreamEvent,
   BatchParsedMarkdownFile,
} from "./schemas.ts";

/**
 * Result type for parse operations that may fail.
 */
export type ParseResult<T> =
   | { success: true; data: T }
   | { success: false; error: Error };

/**
 * Block parser state for tracking context during parsing.
 */
export type BlockParserState =
   | "DOCUMENT"
   | "PARAGRAPH"
   | "ATX_HEADING"
   | "SETEXT_HEADING"
   | "FENCED_CODE"
   | "INDENTED_CODE"
   | "BLOCKQUOTE"
   | "LIST"
   | "LIST_ITEM"
   | "HTML_BLOCK"
   | "BLANK_LINE"
   | "THEMATIC_BREAK"
   | "LINK_REFERENCE";

/**
 * Inline parser state for tracking context during parsing.
 */
export type InlineParserState =
   | "TEXT"
   | "BACKSLASH"
   | "CODE_SPAN"
   | "AUTOLINK"
   | "HTML_INLINE"
   | "EMPHASIS"
   | "LINK_TEXT"
   | "LINK_DESTINATION"
   | "LINK_TITLE"
   | "IMAGE_ALT";

/**
 * Delimiter for emphasis parsing.
 */
export interface Delimiter {
   /** The delimiter character (* or _) */
   char: "*" | "_";
   /** Number of characters (1 for emphasis, 2 for strong) */
   count: number;
   /** Position in the inline token stream */
   position: number;
   /** Can open emphasis */
   canOpen: boolean;
   /** Can close emphasis */
   canClose: boolean;
   /** Is active (not yet matched) */
   active: boolean;
}

/**
 * Bracket for link/image parsing.
 */
export interface Bracket {
   /** Position of the opening bracket */
   position: number;
   /** Whether this is an image bracket (!) */
   isImage: boolean;
   /** Index in the delimiter stack */
   delimiterIndex: number;
   /** Whether bracket is still active */
   active: boolean;
}

/**
 * Token produced during inline tokenization.
 */
export type InlineToken =
   | { type: "text"; value: string; start: number; end: number }
   | { type: "code"; value: string; start: number; end: number }
   | { type: "autolink"; url: string; isEmail: boolean; start: number; end: number }
   | { type: "htmlInline"; value: string; start: number; end: number }
   | { type: "hardBreak"; start: number; end: number }
   | { type: "softBreak"; start: number; end: number }
   | { type: "delimiterRun"; char: "*" | "_"; count: number; start: number; end: number; canOpen: boolean; canClose: boolean }
   | { type: "openBracket"; isImage: boolean; start: number; end: number }
   | { type: "closeBracket"; start: number; end: number }
   | { type: "linkInfo"; url: string; title?: string; start: number; end: number };

/**
 * Context for block parsing.
 */
export interface BlockContext {
   /** Current line number (1-indexed) */
   lineNumber: number;
   /** Current column (1-indexed) */
   column: number;
   /** Current indentation level */
   indent: number;
   /** Whether we're in a tight list */
   tight: boolean;
   /** Whether we're in a blockquote */
   inBlockquote: boolean;
   /** Current list depth */
   listDepth: number;
   /** Current blockquote depth */
   blockquoteDepth: number;
   /** Link reference definitions collected */
   references: Map<string, { url: string; title?: string }>;
}

/**
 * Line info for block parsing.
 */
export interface LineInfo {
   /** Raw line content */
   raw: string;
   /** Line content with leading whitespace stripped */
   content: string;
   /** Number of leading spaces */
   indent: number;
   /** Line number (1-indexed) */
   lineNumber: number;
   /** Whether this is a blank line */
   isBlank: boolean;
}

/**
 * Result of attempting to parse a block.
 */
export interface BlockParseResult {
   /** Whether a block was successfully parsed */
   success: boolean;
   /** The parsed block node */
   node?: import("./schemas.ts").BlockNode;
   /** Number of lines consumed */
   linesConsumed: number;
}

/**
 * Container for tracking open blocks during parsing.
 */
export interface OpenBlock {
   /** The block type */
   type: BlockParserState;
   /** The node being built */
   node: import("./schemas.ts").BlockNode;
   /** Starting line number */
   startLine: number;
   /** Content lines collected */
   contentLines: string[];
   /** Additional metadata */
   meta?: Record<string, unknown>;
}

/**
 * Encoding detection result.
 */
export interface EncodingInfo {
   /** Detected encoding */
   encoding: "utf-8" | "utf-16le" | "utf-16be";
   /** Length of BOM if present */
   bomLength: number;
}

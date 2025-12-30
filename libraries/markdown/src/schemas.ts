import { z } from "zod";

// =============================================================================
// Constants
// =============================================================================

/**
 * Default maximum buffer size (10MB) to prevent memory exhaustion attacks.
 */
export const DEFAULT_MAX_BUFFER_SIZE = 10 * 1024 * 1024;

// =============================================================================
// Position Tracking
// =============================================================================

/**
 * Source position for a node in the original markdown.
 */
export const positionSchema = z.object({
   /** Starting line (1-indexed) */
   startLine: z.number().int().min(1),
   /** Starting column (1-indexed) */
   startColumn: z.number().int().min(1),
   /** Ending line (1-indexed) */
   endLine: z.number().int().min(1),
   /** Ending column (1-indexed) */
   endColumn: z.number().int().min(1),
   /** Start offset in original string */
   startOffset: z.number().int().min(0),
   /** End offset in original string */
   endOffset: z.number().int().min(0),
});

export type Position = z.infer<typeof positionSchema>;

// =============================================================================
// Manual Type Definitions
// =============================================================================
// Define types manually to avoid Zod lazy inference issues

export interface TextNode {
   type: "text";
   value: string;
   position?: Position;
}

export interface CodeSpanNode {
   type: "codeSpan";
   value: string;
   position?: Position;
}

export interface HardBreakNode {
   type: "hardBreak";
   position?: Position;
}

export interface SoftBreakNode {
   type: "softBreak";
   position?: Position;
}

export interface HtmlInlineNode {
   type: "htmlInline";
   value: string;
   position?: Position;
}

export interface EmphasisNode {
   type: "emphasis";
   children: InlineNode[];
   marker: "*" | "_";
   position?: Position;
}

export interface StrongNode {
   type: "strong";
   children: InlineNode[];
   marker: "**" | "__";
   position?: Position;
}

export interface LinkNode {
   type: "link";
   url: string;
   children: InlineNode[];
   title?: string;
   reference?: string;
   position?: Position;
}

export interface ImageNode {
   type: "image";
   alt: string;
   url: string;
   title?: string;
   reference?: string;
   position?: Position;
}

export type InlineNode =
   | TextNode
   | CodeSpanNode
   | HardBreakNode
   | SoftBreakNode
   | HtmlInlineNode
   | EmphasisNode
   | StrongNode
   | LinkNode
   | ImageNode;

// Alias for backward compatibility
export type InlineNodeType = InlineNode;

// =============================================================================
// Block Node Types
// =============================================================================

export interface ThematicBreakNode {
   type: "thematicBreak";
   marker: "-" | "*" | "_";
   position?: Position;
}

export interface HeadingNode {
   type: "heading";
   level: 1 | 2 | 3 | 4 | 5 | 6;
   children: InlineNode[];
   style: "atx" | "setext";
   position?: Position;
}

export interface CodeBlockNode {
   type: "codeBlock";
   value: string;
   style: "fenced" | "indented";
   lang?: string;
   meta?: string;
   fence?: "`" | "~";
   fenceLength?: number;
   position?: Position;
}

export interface HtmlBlockNode {
   type: "htmlBlock";
   value: string;
   htmlType: number;
   position?: Position;
}

export interface ParagraphNode {
   type: "paragraph";
   children: InlineNode[];
   position?: Position;
}

export interface LinkReferenceDefinitionNode {
   type: "linkReferenceDefinition";
   label: string;
   url: string;
   title?: string;
   position?: Position;
}

export interface BlockquoteNode {
   type: "blockquote";
   children: BlockNode[];
   position?: Position;
}

export interface ListItemNode {
   type: "listItem";
   children: BlockNode[];
   marker: "-" | "*" | "+" | ")" | ".";
   spread: boolean;
   checked?: boolean;
   position?: Position;
}

export interface ListNode {
   type: "list";
   ordered: boolean;
   start?: number;
   spread: boolean;
   marker: "-" | "*" | "+" | ")" | ".";
   children: ListItemNode[];
   position?: Position;
}

export type BlockNode =
   | ThematicBreakNode
   | HeadingNode
   | CodeBlockNode
   | HtmlBlockNode
   | ParagraphNode
   | LinkReferenceDefinitionNode
   | BlockquoteNode
   | ListItemNode
   | ListNode;

// Alias for backward compatibility
export type BlockNodeType = BlockNode;

export interface DocumentNode {
   type: "document";
   children: BlockNode[];
   references?: Record<
      string,
      { type: "linkReferenceDefinition"; label: string; url: string; title?: string; position?: Position }
   >;
   position?: Position;
}

export interface MarkdownDocument {
   root: DocumentNode;
   lineEnding: "\n" | "\r\n";
   source?: string;
}

// =============================================================================
// Zod Schemas (for validation only)
// =============================================================================

const inlineNodeBase = z.object({
   position: positionSchema.optional(),
});

export const textNodeSchema = inlineNodeBase.extend({
   type: z.literal("text"),
   value: z.string(),
});

export const codeSpanNodeSchema = inlineNodeBase.extend({
   type: z.literal("codeSpan"),
   value: z.string(),
});

export const hardBreakNodeSchema = inlineNodeBase.extend({
   type: z.literal("hardBreak"),
});

export const softBreakNodeSchema = inlineNodeBase.extend({
   type: z.literal("softBreak"),
});

export const htmlInlineNodeSchema = inlineNodeBase.extend({
   type: z.literal("htmlInline"),
   value: z.string(),
});

// Use z.array(z.unknown()) for recursive types in schemas
export const emphasisNodeSchema = inlineNodeBase.extend({
   type: z.literal("emphasis"),
   children: z.array(z.unknown()),
   marker: z.enum(["*", "_"]),
});

export const strongNodeSchema = inlineNodeBase.extend({
   type: z.literal("strong"),
   children: z.array(z.unknown()),
   marker: z.enum(["**", "__"]),
});

export const linkNodeSchema = inlineNodeBase.extend({
   type: z.literal("link"),
   url: z.string(),
   children: z.array(z.unknown()),
   title: z.string().optional(),
   reference: z.string().optional(),
});

export const imageNodeSchema = inlineNodeBase.extend({
   type: z.literal("image"),
   alt: z.string(),
   url: z.string(),
   title: z.string().optional(),
   reference: z.string().optional(),
});

// Union of all inline node schemas (for validation)
export const inlineNodeSchema = z.union([
   textNodeSchema,
   codeSpanNodeSchema,
   hardBreakNodeSchema,
   softBreakNodeSchema,
   htmlInlineNodeSchema,
   emphasisNodeSchema,
   strongNodeSchema,
   linkNodeSchema,
   imageNodeSchema,
]);

// =============================================================================
// Block Node Schemas
// =============================================================================

const blockNodeBase = z.object({
   position: positionSchema.optional(),
});

export const thematicBreakNodeSchema = blockNodeBase.extend({
   type: z.literal("thematicBreak"),
   marker: z.enum(["-", "*", "_"]),
});

export const headingNodeSchema = blockNodeBase.extend({
   type: z.literal("heading"),
   level: z.number().int().min(1).max(6),
   children: z.array(z.unknown()),
   style: z.enum(["atx", "setext"]),
});

export const codeBlockNodeSchema = blockNodeBase.extend({
   type: z.literal("codeBlock"),
   value: z.string(),
   style: z.enum(["fenced", "indented"]),
   lang: z.string().optional(),
   meta: z.string().optional(),
   fence: z.enum(["`", "~"]).optional(),
   fenceLength: z.number().int().min(3).optional(),
});

export const htmlBlockNodeSchema = blockNodeBase.extend({
   type: z.literal("htmlBlock"),
   value: z.string(),
   htmlType: z.number().int().min(1).max(7),
});

export const paragraphNodeSchema = blockNodeBase.extend({
   type: z.literal("paragraph"),
   children: z.array(z.unknown()),
});

export const linkReferenceDefinitionSchema = blockNodeBase.extend({
   type: z.literal("linkReferenceDefinition"),
   label: z.string(),
   url: z.string(),
   title: z.string().optional(),
});

export const blockquoteNodeSchema = blockNodeBase.extend({
   type: z.literal("blockquote"),
   children: z.array(z.unknown()),
});

export const listItemNodeSchema = blockNodeBase.extend({
   type: z.literal("listItem"),
   children: z.array(z.unknown()),
   marker: z.enum(["-", "*", "+", ")", "."]),
   spread: z.boolean(),
   checked: z.boolean().optional(),
});

export const listNodeSchema = blockNodeBase.extend({
   type: z.literal("list"),
   ordered: z.boolean(),
   start: z.number().int().min(0).optional(),
   spread: z.boolean(),
   marker: z.enum(["-", "*", "+", ")", "."]),
   children: z.array(z.unknown()),
});

// Union of all block node schemas
export const blockNodeSchema = z.union([
   thematicBreakNodeSchema,
   headingNodeSchema,
   codeBlockNodeSchema,
   htmlBlockNodeSchema,
   paragraphNodeSchema,
   linkReferenceDefinitionSchema,
   blockquoteNodeSchema,
   listItemNodeSchema,
   listNodeSchema,
]);

// =============================================================================
// Document Schema
// =============================================================================

export const documentNodeSchema = z.object({
   type: z.literal("document"),
   children: z.array(z.unknown()),
   references: z
      .record(
         z.string(),
         z.object({
            type: z.literal("linkReferenceDefinition"),
            label: z.string(),
            url: z.string(),
            title: z.string().optional(),
            position: positionSchema.optional(),
         }),
      )
      .optional(),
   position: positionSchema.optional(),
});

export const markdownDocumentSchema = z.object({
   root: documentNodeSchema,
   lineEnding: z.enum(["\n", "\r\n"]),
   source: z.string().optional(),
});

// =============================================================================
// Parse Options
// =============================================================================

/**
 * Parse options.
 */
export const parseOptionsSchema = z.object({
   /** Include position information in AST nodes */
   positions: z.boolean().optional().default(true),
   /** Preserve original source in document */
   preserveSource: z.boolean().optional().default(false),
});

// Use z.input to get optional types for function parameters
export type ParseOptions = z.input<typeof parseOptionsSchema>;

/**
 * Generate options.
 */
export const generateOptionsSchema = z.object({
   /** Line ending to use */
   lineEnding: z.enum(["\n", "\r\n"]).optional().default("\n"),
   /** Indent for nested content (spaces) */
   indent: z.number().int().min(1).max(8).optional().default(3),
   /** Use setext headings for level 1-2 */
   setext: z.boolean().optional().default(false),
   /** Fence character for code blocks */
   fence: z.enum(["`", "~"]).optional().default("`"),
   /** Fence length for code blocks */
   fenceLength: z.number().int().min(3).optional().default(3),
   /** Emphasis marker */
   emphasis: z.enum(["*", "_"]).optional().default("*"),
   /** Strong marker */
   strong: z.enum(["**", "__"]).optional().default("**"),
   /** Bullet marker for unordered lists */
   bullet: z.enum(["-", "*", "+"]).optional().default("-"),
   /** Ordered list marker */
   orderedMarker: z.enum([")", "."]).optional().default("."),
   /** Thematic break character */
   thematicBreak: z.enum(["-", "*", "_"]).optional().default("-"),
   /** Thematic break length */
   thematicBreakLength: z.number().int().min(3).optional().default(3),
});

// Use z.input to get optional types for function parameters
export type GenerateOptions = z.input<typeof generateOptionsSchema>;

/**
 * Stream options.
 */
export const streamOptionsSchema = parseOptionsSchema.extend({
   /** Chunk size for processing (default: 64KB) */
   chunkSize: z.number().int().positive().optional().default(65536),
   /** Maximum buffer size in bytes */
   maxBufferSize: z
      .number()
      .int()
      .positive()
      .optional()
      .default(DEFAULT_MAX_BUFFER_SIZE),
});

// Use z.input to get optional types for function parameters
export type StreamOptions = z.input<typeof streamOptionsSchema>;

// =============================================================================
// Streaming Event Types
// =============================================================================

export interface BlockStreamEvent {
   type: "block";
   data: BlockNode;
}

export interface CompleteStreamEvent {
   type: "complete";
   document: MarkdownDocument;
}

export interface ErrorStreamEvent {
   type: "error";
   error: string;
}

export type StreamEvent = BlockStreamEvent | CompleteStreamEvent | ErrorStreamEvent;

// =============================================================================
// Batch Processing Types
// =============================================================================

export interface BatchMarkdownFileInput {
   filename: string;
   content: string;
}

export interface FileStartEvent {
   type: "file_start";
   fileIndex: number;
   filename: string;
}

export interface FileCompleteEvent {
   type: "file_complete";
   fileIndex: number;
   filename: string;
   document: MarkdownDocument;
}

export interface FileErrorEvent {
   type: "file_error";
   fileIndex: number;
   filename: string;
   error: string;
}

export interface BatchBlockEvent {
   type: "block";
   fileIndex: number;
   data: BlockNode;
}

export interface BatchCompleteEvent {
   type: "batch_complete";
   totalFiles: number;
   errorCount: number;
}

export type BatchMarkdownStreamEvent =
   | FileStartEvent
   | FileCompleteEvent
   | FileErrorEvent
   | BatchBlockEvent
   | BatchCompleteEvent;

export interface BatchMarkdownFileResult {
   filename: string;
   document?: MarkdownDocument;
   error?: string;
}

// =============================================================================
// Type Aliases (for backward compatibility)
// =============================================================================

/** Alias for LinkReferenceDefinitionNode */
export type LinkReferenceDefinition = LinkReferenceDefinitionNode;

/** Alias for BatchMarkdownFileResult */
export type BatchParsedMarkdownFile = BatchMarkdownFileResult;

/** Union type for any node */
export type Node = InlineNode | BlockNode | DocumentNode;

/** Nodes that contain a value property */
export type LiteralNode = TextNode | CodeSpanNode | HtmlInlineNode | CodeBlockNode | HtmlBlockNode;

/** Nodes that contain children */
export type ParentNode = EmphasisNode | StrongNode | LinkNode | HeadingNode | ParagraphNode | BlockquoteNode | ListItemNode | ListNode | DocumentNode;

// =============================================================================
// Parser Exports
// =============================================================================

export {
   // Main parser functions
   parse,
   parseBuffer,
   parseBufferOrThrow,
   parseOrThrow,
   // Convenience functions
   countWords,
   extractText,
   getCodeBlocks,
   getHeadings,
   getImages,
   getLinks,
   isValidMarkdown,
   parseToAst,
} from "./parser.ts";

// =============================================================================
// Generator Exports
// =============================================================================

export {
   // Main generator functions
   createGenerator,
   generate,
   generateNode,
   // Convenience string generators
   generateBlockquoteString,
   generateCodeBlockString,
   generateEmphasisString,
   generateHeadingString,
   generateImageString,
   generateInlineCodeString,
   generateLinkString,
   generateListString,
   generateStrongString,
} from "./generator.ts";

// =============================================================================
// Streaming Exports
// =============================================================================

export {
   parseBatchStream,
   parseBatchStreamToArray,
   parseBufferStream,
   parseStream,
   parseStreamToDocument,
} from "./stream.ts";

// =============================================================================
// Schema Exports
// =============================================================================

export {
   // Constants
   DEFAULT_MAX_BUFFER_SIZE,
   // Option schemas
   generateOptionsSchema,
   parseOptionsSchema,
   streamOptionsSchema,
   // Node schemas
   blockNodeSchema,
   blockquoteNodeSchema,
   codeBlockNodeSchema,
   codeSpanNodeSchema,
   documentNodeSchema,
   emphasisNodeSchema,
   hardBreakNodeSchema,
   headingNodeSchema,
   htmlBlockNodeSchema,
   htmlInlineNodeSchema,
   imageNodeSchema,
   inlineNodeSchema,
   linkNodeSchema,
   linkReferenceDefinitionSchema,
   listItemNodeSchema,
   listNodeSchema,
   markdownDocumentSchema,
   paragraphNodeSchema,
   positionSchema,
   softBreakNodeSchema,
   strongNodeSchema,
   textNodeSchema,
   thematicBreakNodeSchema,
} from "./schemas.ts";

// =============================================================================
// Type Exports
// =============================================================================

export type {
   // Document types
   DocumentNode,
   MarkdownDocument,
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
   CodeSpanNode,
   EmphasisNode,
   HardBreakNode,
   HtmlInlineNode,
   ImageNode,
   InlineNode,
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

export type {
   // Internal types (useful for custom parsers)
   BlockContext,
   BlockParseResult,
   BlockParserState,
   Bracket,
   Delimiter,
   EncodingInfo,
   InlineParserState,
   InlineToken,
   LineInfo,
   OpenBlock,
   ParseResult,
} from "./types.ts";

// =============================================================================
// Utility Exports
// =============================================================================

export {
   // Encoding utilities
   decodeBuffer,
   detectEncoding,
   detectLineEnding,
   normalizeLineEndings,
   // Line utilities
   countIndent,
   isBlankLine,
   removeIndent,
   splitLines,
   // Escaping utilities
   decodeHtmlEntities,
   decodeUrl,
   encodeHtmlEntities,
   encodeUrl,
   escapeMarkdown,
   normalizeLabel,
   unescapeMarkdown,
   // String utilities
   padEnd,
   repeat,
   // Validation utilities
   isValidEmail,
   isValidUrl,
   // Pattern matching
   ATX_HEADING_REGEX,
   AUTOLINK_REGEX,
   BLOCKQUOTE_REGEX,
   COLLAPSED_LINK_REGEX,
   EMAIL_AUTOLINK_REGEX,
   FENCED_CODE_OPEN_REGEX,
   INLINE_LINK_REGEX,
   LINK_REFERENCE_REGEX,
   ORDERED_LIST_REGEX,
   REFERENCE_LINK_REGEX,
   SETEXT_HEADING_REGEX,
   SHORTCUT_LINK_REGEX,
   THEMATIC_BREAK_REGEX,
   UNORDERED_LIST_REGEX,
   // HTML block detection
   closesHtmlBlock,
   getHtmlBlockType,
   HTML_BLOCK_1_CLOSE,
   HTML_BLOCK_1_OPEN,
   HTML_BLOCK_2_CLOSE,
   HTML_BLOCK_2_OPEN,
   HTML_BLOCK_3_CLOSE,
   HTML_BLOCK_3_OPEN,
   HTML_BLOCK_4_CLOSE,
   HTML_BLOCK_4_OPEN,
   HTML_BLOCK_5_CLOSE,
   HTML_BLOCK_5_OPEN,
   HTML_BLOCK_6_OPEN,
   HTML_BLOCK_7_OPEN,
} from "./utils.ts";

// =============================================================================
// Block Parser Exports (for advanced use)
// =============================================================================

export {
   createBlockContext,
   isAtxHeading,
   isBlockquoteStart,
   isFencedCodeStart,
   isIndentedCode,
   isLinkReferenceDefinition,
   isListItemStart,
   isSetextUnderline,
   isThematicBreak,
   parseBlocks,
} from "./block-parser.ts";

// =============================================================================
// Inline Parser Exports (for advanced use)
// =============================================================================

export { parseInline } from "./inline-parser.ts";

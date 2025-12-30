import type {
   BlockNode,
   BlockquoteNode,
   CodeBlockNode,
   DocumentNode,
   GenerateOptions,
   HeadingNode,
   HtmlBlockNode,
   InlineNode,
   ListItemNode,
   ListNode,
   MarkdownDocument,
   Node,
   ParagraphNode,
   ThematicBreakNode,
} from "./schemas.ts";
import { generateOptionsSchema } from "./schemas.ts";
import { encodeUrl, escapeMarkdown, repeat } from "./utils.ts";

// =============================================================================
// Default Options
// =============================================================================

const DEFAULT_OPTIONS: Required<GenerateOptions> = {
   lineEnding: "\n",
   indent: 3,
   setext: false,
   fence: "`",
   fenceLength: 3,
   emphasis: "*",
   strong: "**",
   bullet: "-",
   orderedMarker: ".",
   thematicBreak: "-",
   thematicBreakLength: 3,
};

// =============================================================================
// Public API
// =============================================================================

/**
 * Generates markdown string from a document AST.
 *
 * @param document - The markdown document or root node to convert
 * @param options - Generation options
 * @returns The generated markdown string
 *
 * @example
 * ```typescript
 * const doc = parse("# Hello");
 * const markdown = generate(doc);
 * console.log(markdown); // "# Hello"
 * ```
 */
export function generate(
   document: MarkdownDocument | DocumentNode,
   options?: GenerateOptions,
): string {
   // Validate options if provided
   if (options !== undefined) {
      generateOptionsSchema.parse(options);
   }

   const opts = { ...DEFAULT_OPTIONS, ...options };
   const root = "root" in document ? document.root : document;

   return generateDocument(root, opts);
}

/**
 * Generates markdown string from any AST node.
 *
 * @param node - The node to convert
 * @param options - Generation options
 * @returns The generated markdown string
 *
 * @example
 * ```typescript
 * const node: HeadingNode = { type: "heading", level: 1, children: [...], style: "atx" };
 * const markdown = generateNode(node);
 * ```
 */
export function generateNode(node: Node, options?: GenerateOptions): string {
   // Validate options if provided
   if (options !== undefined) {
      generateOptionsSchema.parse(options);
   }

   const opts = { ...DEFAULT_OPTIONS, ...options };

   if (node.type === "document") {
      return generateDocument(node, opts);
   }

   if (isBlockNode(node)) {
      return generateBlock(node, opts, 0);
   }

   return generateInline(node, opts);
}

/**
 * Creates an incremental markdown generator.
 *
 * @param options - Generation options
 * @returns A generator object with methods to add nodes
 *
 * @example
 * ```typescript
 * const gen = createGenerator();
 * gen.addNode({ type: "heading", level: 1, children: [...], style: "atx" });
 * gen.addNode({ type: "paragraph", children: [...] });
 * console.log(gen.toString());
 * ```
 */
export function createGenerator(options?: GenerateOptions): {
   addNode: (node: Node) => void;
   toString: () => string;
   toStream: () => ReadableStream<string>;
} {
   // Validate options if provided
   if (options !== undefined) {
      generateOptionsSchema.parse(options);
   }

   const opts = { ...DEFAULT_OPTIONS, ...options };
   const blocks: string[] = [];

   return {
      addNode(node: Node) {
         if (node.type === "document") {
            for (const child of node.children) {
               blocks.push(generateBlock(child, opts, 0));
            }
         } else if (isBlockNode(node)) {
            blocks.push(generateBlock(node, opts, 0));
         } else {
            blocks.push(generateInline(node, opts));
         }
      },

      toString() {
         return blocks.join(opts.lineEnding + opts.lineEnding);
      },

      toStream() {
         const blocksSnapshot = [...blocks];
         const lineEnding = opts.lineEnding;
         let index = 0;

         return new ReadableStream<string>({
            pull(controller) {
               if (index >= blocksSnapshot.length) {
                  controller.close();
                  return;
               }

               const block = blocksSnapshot[index];
               const isLast = index === blocksSnapshot.length - 1;

               controller.enqueue(
                  isLast ? block : block + lineEnding + lineEnding,
               );
               index++;
            },
         });
      },
   };
}

// =============================================================================
// Type Guards
// =============================================================================

function isBlockNode(node: Node): node is BlockNode {
   return [
      "thematicBreak",
      "heading",
      "codeBlock",
      "htmlBlock",
      "paragraph",
      "linkReferenceDefinition",
      "blockquote",
      "list",
      "listItem",
   ].includes(node.type);
}

// =============================================================================
// Document Generation
// =============================================================================

function generateDocument(
   node: DocumentNode,
   opts: Required<GenerateOptions>,
): string {
   const blocks = node.children.map((child) => generateBlock(child, opts, 0));
   return blocks.join(opts.lineEnding + opts.lineEnding);
}

// =============================================================================
// Block Generation
// =============================================================================

function generateBlock(
   node: BlockNode,
   opts: Required<GenerateOptions>,
   depth: number,
): string {
   switch (node.type) {
      case "thematicBreak":
         return generateThematicBreak(node, opts);
      case "heading":
         return generateHeading(node, opts);
      case "codeBlock":
         return generateCodeBlock(node, opts);
      case "htmlBlock":
         return generateHtmlBlock(node);
      case "paragraph":
         return generateParagraph(node, opts);
      case "blockquote":
         return generateBlockquote(node, opts, depth);
      case "list":
         return generateList(node, opts, depth);
      case "listItem":
         return generateListItem(node, opts, depth);
      case "linkReferenceDefinition":
         return generateLinkReferenceDefinition(node);
      default:
         return "";
   }
}

function generateThematicBreak(
   node: ThematicBreakNode,
   opts: Required<GenerateOptions>,
): string {
   const char = node.marker ?? opts.thematicBreak;
   return repeat(char, opts.thematicBreakLength);
}

function generateHeading(
   node: HeadingNode,
   opts: Required<GenerateOptions>,
): string {
   const text = node.children.map((child) => generateInline(child, opts)).join("");

   // Use setext style for levels 1-2 if enabled and style matches
   if (opts.setext && (node.level === 1 || node.level === 2)) {
      const underlineChar = node.level === 1 ? "=" : "-";
      const underline = repeat(underlineChar, Math.max(text.length, 3));
      return text + opts.lineEnding + underline;
   }

   // Default to ATX style
   return repeat("#", node.level) + " " + text;
}

function generateCodeBlock(
   node: CodeBlockNode,
   opts: Required<GenerateOptions>,
): string {
   if (node.style === "indented") {
      // Indent each line by 4 spaces
      const lines = node.value.split("\n");
      return lines.map((line) => "    " + line).join(opts.lineEnding);
   }

   // Fenced code block - always use opts.fence for consistency
   const fence = opts.fence;
   const fenceLength = node.fenceLength ?? opts.fenceLength;
   const fenceStr = repeat(fence, fenceLength);

   let infoString = node.lang ?? "";
   if (node.meta) {
      infoString += " " + node.meta;
   }

   const lines = [fenceStr + infoString, node.value, fenceStr];
   return lines.join(opts.lineEnding);
}

function generateHtmlBlock(node: HtmlBlockNode): string {
   return node.value;
}

function generateParagraph(
   node: ParagraphNode,
   opts: Required<GenerateOptions>,
): string {
   return node.children.map((child) => generateInline(child, opts)).join("");
}

function generateBlockquote(
   node: BlockquoteNode,
   opts: Required<GenerateOptions>,
   depth: number,
): string {
   const content = node.children
      .map((child) => generateBlock(child, opts, depth))
      .join(opts.lineEnding + opts.lineEnding);

   // Prefix each line with >
   const lines = content.split(opts.lineEnding);
   return lines.map((line) => (line ? "> " + line : ">")).join(opts.lineEnding);
}

function generateList(
   node: ListNode,
   opts: Required<GenerateOptions>,
   depth: number,
): string {
   const items: string[] = [];
   let counter = node.start ?? 1;

   for (const item of node.children) {
      const marker = node.ordered
         ? `${counter}${node.marker ?? opts.orderedMarker}`
         : (node.marker ?? opts.bullet);

      const content = generateListItem(item, opts, depth + 1);
      const lines = content.split(opts.lineEnding);

      // First line gets the marker
      const firstLine = marker + " " + (lines[0] ?? "");

      // Subsequent lines get indentation
      const indent = repeat(" ", marker.length + 1);
      const restLines = lines.slice(1).map((line) => (line ? indent + line : ""));

      items.push([firstLine, ...restLines].join(opts.lineEnding));
      counter++;
   }

   // Join with single or double line ending based on spread
   const separator = node.spread
      ? opts.lineEnding + opts.lineEnding
      : opts.lineEnding;

   return items.join(separator);
}

function generateListItem(
   node: ListItemNode,
   opts: Required<GenerateOptions>,
   depth: number,
): string {
   // Handle task list
   let prefix = "";
   if (node.checked !== undefined) {
      prefix = node.checked ? "[x] " : "[ ] ";
   }

   const content = node.children
      .map((child) => generateBlock(child, opts, depth))
      .join(opts.lineEnding + opts.lineEnding);

   return prefix + content;
}

function generateLinkReferenceDefinition(node: {
   type: "linkReferenceDefinition";
   label: string;
   url: string;
   title?: string;
}): string {
   let result = `[${node.label}]: ${encodeUrl(node.url)}`;
   if (node.title) {
      result += ` "${node.title}"`;
   }
   return result;
}

// =============================================================================
// Inline Generation
// =============================================================================

function generateInline(
   node: InlineNode,
   opts: Required<GenerateOptions>,
): string {
   switch (node.type) {
      case "text":
         return node.value;

      case "codeSpan":
         return generateCodeSpan(node.value);

      case "emphasis":
         return generateEmphasis(node, opts);

      case "strong":
         return generateStrong(node, opts);

      case "link":
         return generateLink(node, opts);

      case "image":
         return generateImage(node);

      case "hardBreak":
         return "  " + opts.lineEnding;

      case "softBreak":
         return opts.lineEnding;

      case "htmlInline":
         return node.value;

      default:
         return "";
   }
}

function generateCodeSpan(value: string): string {
   // Determine how many backticks we need
   let maxBackticks = 0;
   let current = 0;

   for (const char of value) {
      if (char === "`") {
         current++;
         maxBackticks = Math.max(maxBackticks, current);
      } else {
         current = 0;
      }
   }

   const backtickCount = maxBackticks + 1;
   const backticks = "`".repeat(backtickCount);

   // Add space padding if:
   // - Content starts or ends with backtick
   // - Content starts AND ends with spaces (and not empty)
   // - Using more than 1 backtick (for clarity per CommonMark)
   const needsPadding =
      backtickCount > 1 ||
      value.startsWith("`") ||
      value.endsWith("`") ||
      (value.startsWith(" ") && value.endsWith(" ") && value.length > 0);

   if (needsPadding) {
      return backticks + " " + value + " " + backticks;
   }

   return backticks + value + backticks;
}

function generateEmphasis(
   node: { type: "emphasis"; children: InlineNode[]; marker: "*" | "_" },
   opts: Required<GenerateOptions>,
): string {
   const marker = node.marker ?? opts.emphasis;
   const content = node.children
      .map((child) => generateInline(child, opts))
      .join("");
   return marker + content + marker;
}

function generateStrong(
   node: { type: "strong"; children: InlineNode[]; marker: "**" | "__" },
   opts: Required<GenerateOptions>,
): string {
   const marker = node.marker ?? opts.strong;
   const content = node.children
      .map((child) => generateInline(child, opts))
      .join("");
   return marker + content + marker;
}

function generateLink(
   node: { type: "link"; children: InlineNode[]; url: string; title?: string },
   opts: Required<GenerateOptions>,
): string {
   const text = node.children.map((child) => generateInline(child, opts)).join("");
   const url = encodeUrl(node.url);

   if (node.title) {
      return `[${text}](${url} "${node.title}")`;
   }

   return `[${text}](${url})`;
}

function generateImage(node: {
   type: "image";
   alt: string;
   url: string;
   title?: string;
}): string {
   const url = encodeUrl(node.url);

   if (node.title) {
      return `![${node.alt}](${url} "${node.title}")`;
   }

   return `![${node.alt}](${url})`;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Generates a heading string.
 *
 * @param level - Heading level (1-6)
 * @param text - Heading text
 * @param style - Heading style (atx or setext)
 * @returns The generated heading
 *
 * @example
 * ```typescript
 * generateHeadingString(1, "Hello"); // "# Hello"
 * generateHeadingString(2, "World", "setext"); // "World\n------"
 * ```
 */
export function generateHeadingString(
   level: 1 | 2 | 3 | 4 | 5 | 6,
   text: string,
   style: "atx" | "setext" = "atx",
): string {
   if (style === "setext" && (level === 1 || level === 2)) {
      const underlineChar = level === 1 ? "=" : "-";
      const underline = repeat(underlineChar, Math.max(text.length, 3));
      return text + "\n" + underline;
   }

   return repeat("#", level) + " " + text;
}

/**
 * Generates a link string.
 *
 * @param text - Link text
 * @param url - Link URL
 * @param title - Optional link title
 * @returns The generated link
 *
 * @example
 * ```typescript
 * generateLinkString("Example", "https://example.com"); // "[Example](https://example.com)"
 * ```
 */
export function generateLinkString(
   text: string,
   url: string,
   title?: string,
): string {
   const encodedUrl = encodeUrl(url);
   if (title) {
      return `[${text}](${encodedUrl} "${title}")`;
   }
   return `[${text}](${encodedUrl})`;
}

/**
 * Generates an image string.
 *
 * @param alt - Alt text
 * @param url - Image URL
 * @param title - Optional image title
 * @returns The generated image
 *
 * @example
 * ```typescript
 * generateImageString("Logo", "logo.png"); // "![Logo](logo.png)"
 * ```
 */
export function generateImageString(
   alt: string,
   url: string,
   title?: string,
): string {
   const encodedUrl = encodeUrl(url);
   if (title) {
      return `![${alt}](${encodedUrl} "${title}")`;
   }
   return `![${alt}](${encodedUrl})`;
}

/**
 * Generates a code block string.
 *
 * @param code - The code content
 * @param lang - Optional language identifier
 * @param style - Code block style (fenced or indented)
 * @returns The generated code block
 *
 * @example
 * ```typescript
 * generateCodeBlockString("console.log('hi');", "js");
 * // "```js\nconsole.log('hi');\n```"
 * ```
 */
export function generateCodeBlockString(
   code: string,
   lang?: string,
   style: "fenced" | "indented" = "fenced",
): string {
   if (style === "indented") {
      return code
         .split("\n")
         .map((line) => "    " + line)
         .join("\n");
   }

   const fence = "```";
   const infoString = lang ?? "";
   return fence + infoString + "\n" + code + "\n" + fence;
}

/**
 * Generates a list string from items.
 *
 * @param items - List items (strings or nested lists)
 * @param ordered - Whether the list is ordered
 * @param start - Starting number for ordered lists
 * @returns The generated list
 *
 * @example
 * ```typescript
 * generateListString(["First", "Second"]); // "- First\n- Second"
 * generateListString(["First", "Second"], true); // "1. First\n2. Second"
 * ```
 */
export function generateListString(
   items: string[],
   ordered = false,
   start = 1,
): string {
   return items
      .map((item, i) => {
         const marker = ordered ? `${start + i}.` : "-";
         return `${marker} ${item}`;
      })
      .join("\n");
}

/**
 * Generates a blockquote string.
 *
 * @param content - The content to quote
 * @returns The generated blockquote
 *
 * @example
 * ```typescript
 * generateBlockquoteString("Hello world"); // "> Hello world"
 * ```
 */
export function generateBlockquoteString(content: string): string {
   return content
      .split("\n")
      .map((line) => (line ? "> " + line : ">"))
      .join("\n");
}

/**
 * Wraps text with emphasis markers.
 *
 * @param text - The text to emphasize
 * @param marker - The emphasis marker (* or _)
 * @returns The emphasized text
 *
 * @example
 * ```typescript
 * generateEmphasisString("hello"); // "*hello*"
 * ```
 */
export function generateEmphasisString(
   text: string,
   marker: "*" | "_" = "*",
): string {
   return marker + text + marker;
}

/**
 * Wraps text with strong emphasis markers.
 *
 * @param text - The text to emphasize
 * @param marker - The strong marker (** or __)
 * @returns The strongly emphasized text
 *
 * @example
 * ```typescript
 * generateStrongString("hello"); // "**hello**"
 * ```
 */
export function generateStrongString(
   text: string,
   marker: "**" | "__" = "**",
): string {
   return marker + text + marker;
}

/**
 * Wraps text in inline code.
 *
 * @param text - The text to wrap
 * @returns The inline code
 *
 * @example
 * ```typescript
 * generateInlineCodeString("foo"); // "`foo`"
 * ```
 */
export function generateInlineCodeString(text: string): string {
   return generateCodeSpan(text);
}

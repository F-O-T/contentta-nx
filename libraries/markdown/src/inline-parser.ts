import type {
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
} from "./schemas.ts";
import type { Bracket, Delimiter, InlineToken } from "./types.ts";
import {
   AUTOLINK_REGEX,
   EMAIL_AUTOLINK_REGEX,
   decodeHtmlEntities,
   normalizeLabel,
   unescapeMarkdown,
} from "./utils.ts";

// =============================================================================
// Tokenization
// =============================================================================

/**
 * Tokenizes inline content into a sequence of tokens.
 */
function tokenize(text: string): InlineToken[] {
   const tokens: InlineToken[] = [];
   let i = 0;
   let textStart = 0;

   const pushText = (end: number) => {
      if (end > textStart) {
         tokens.push({
            type: "text",
            value: text.slice(textStart, end),
            start: textStart,
            end,
         });
      }
   };

   while (i < text.length) {
      const char = text[i];

      // Backslash escapes
      if (char === "\\") {
         if (i + 1 < text.length) {
            const nextChar = text[i + 1];
            // Hard line break (backslash at end of line)
            if (nextChar === "\n") {
               pushText(i);
               tokens.push({ type: "hardBreak", start: i, end: i + 2 });
               i += 2;
               textStart = i;
               continue;
            }
            // Escapable characters
            if (
               nextChar &&
               "\\!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~".includes(nextChar)
            ) {
               pushText(i);
               tokens.push({
                  type: "text",
                  value: nextChar,
                  start: i,
                  end: i + 2,
               });
               i += 2;
               textStart = i;
               continue;
            }
         }
         i++;
         continue;
      }

      // Code spans
      if (char === "`") {
         const codeSpan = parseCodeSpan(text, i);
         if (codeSpan) {
            pushText(i);
            tokens.push(codeSpan);
            i = codeSpan.end;
            textStart = i;
            continue;
         }
         i++;
         continue;
      }

      // Autolinks
      if (char === "<") {
         const autolink = parseAutolink(text, i);
         if (autolink) {
            pushText(i);
            tokens.push(autolink);
            i = autolink.end;
            textStart = i;
            continue;
         }

         // HTML inline
         const htmlInline = parseHtmlInline(text, i);
         if (htmlInline) {
            pushText(i);
            tokens.push(htmlInline);
            i = htmlInline.end;
            textStart = i;
            continue;
         }

         i++;
         continue;
      }

      // Line breaks
      if (char === "\n") {
         pushText(i);
         // Check for hard break (two spaces before newline)
         const prevText = text.slice(textStart, i);
         if (prevText.endsWith("  ")) {
            // Remove trailing spaces from previous text token
            if (
               tokens.length > 0 &&
               tokens[tokens.length - 1]?.type === "text"
            ) {
               const lastToken = tokens[tokens.length - 1] as InlineToken & {
                  type: "text";
               };
               lastToken.value = lastToken.value.replace(/  +$/, "");
            }
            tokens.push({ type: "hardBreak", start: i, end: i + 1 });
         } else {
            tokens.push({ type: "softBreak", start: i, end: i + 1 });
         }
         i++;
         textStart = i;
         continue;
      }

      // Emphasis delimiters
      if (char === "*" || char === "_") {
         const run = parseDelimiterRun(text, i, char);
         if (run) {
            pushText(i);
            tokens.push(run);
            i = run.end;
            textStart = i;
            continue;
         }
         i++;
         continue;
      }

      // Link/Image brackets
      if (char === "[") {
         pushText(i);
         // Check for image
         const isImage = i > 0 && text[i - 1] === "!";
         if (isImage && tokens.length > 0) {
            // Remove the ! from previous text
            const lastToken = tokens[tokens.length - 1];
            if (lastToken?.type === "text" && lastToken.value.endsWith("!")) {
               lastToken.value = lastToken.value.slice(0, -1);
               if (lastToken.value === "") {
                  tokens.pop();
               }
            }
         }
         tokens.push({
            type: "openBracket",
            isImage,
            start: isImage ? i - 1 : i,
            end: i + 1,
         });
         i++;
         textStart = i;
         continue;
      }

      if (char === "]") {
         pushText(i);
         tokens.push({ type: "closeBracket", start: i, end: i + 1 });
         i++;
         textStart = i;

         // Check for link destination
         if (i < text.length && text[i] === "(") {
            const linkInfo = parseLinkDestination(text, i);
            if (linkInfo) {
               tokens.push(linkInfo);
               i = linkInfo.end;
               textStart = i;
            }
         } else if (i < text.length && text[i] === "[") {
            // Reference link
            const refEnd = text.indexOf("]", i + 1);
            if (refEnd > i + 1) {
               const ref = text.slice(i + 1, refEnd);
               tokens.push({
                  type: "linkInfo",
                  url: "",
                  title: ref,
                  start: i,
                  end: refEnd + 1,
               });
               i = refEnd + 1;
               textStart = i;
            }
         }
         continue;
      }

      i++;
   }

   pushText(text.length);
   return tokens;
}

/**
 * Parses a code span starting at the given position.
 */
function parseCodeSpan(
   text: string,
   start: number,
): (InlineToken & { type: "code" }) | null {
   // Count opening backticks
   let backticks = 0;
   let i = start;
   while (i < text.length && text[i] === "`") {
      backticks++;
      i++;
   }

   if (backticks === 0) return null;

   // Find matching closing backticks
   const closingPattern = "`".repeat(backticks);
   let searchStart = i;

   while (searchStart < text.length) {
      const closingIndex = text.indexOf(closingPattern, searchStart);
      if (closingIndex === -1) return null;

      // Make sure it's exactly the right number of backticks
      const afterClosing = closingIndex + backticks;
      if (
         (closingIndex === searchStart ||
            text[closingIndex - 1] !== "`") &&
         (afterClosing >= text.length || text[afterClosing] !== "`")
      ) {
         // Extract content and normalize
         let content = text.slice(i, closingIndex);

         // Collapse internal newlines to spaces
         content = content.replace(/\n/g, " ");

         // Strip one leading and one trailing space if both present
         if (
            content.length >= 2 &&
            content.startsWith(" ") &&
            content.endsWith(" ") &&
            !/^ +$/.test(content)
         ) {
            content = content.slice(1, -1);
         }

         return {
            type: "code",
            value: content,
            start,
            end: afterClosing,
         };
      }

      searchStart = closingIndex + 1;
   }

   return null;
}

/**
 * Parses an autolink starting at the given position.
 */
function parseAutolink(
   text: string,
   start: number,
): (InlineToken & { type: "autolink" }) | null {
   if (text[start] !== "<") return null;

   // Find closing >
   const closingIndex = text.indexOf(">", start + 1);
   if (closingIndex === -1) return null;

   const content = text.slice(start, closingIndex + 1);

   // Check for URL autolink
   const urlMatch = AUTOLINK_REGEX.exec(content);
   if (urlMatch && urlMatch[1]) {
      return {
         type: "autolink",
         url: urlMatch[1],
         isEmail: false,
         start,
         end: closingIndex + 1,
      };
   }

   // Check for email autolink
   const emailMatch = EMAIL_AUTOLINK_REGEX.exec(content);
   if (emailMatch && emailMatch[1]) {
      return {
         type: "autolink",
         url: `mailto:${emailMatch[1]}`,
         isEmail: true,
         start,
         end: closingIndex + 1,
      };
   }

   return null;
}

/**
 * Parses inline HTML starting at the given position.
 */
function parseHtmlInline(
   text: string,
   start: number,
): (InlineToken & { type: "htmlInline" }) | null {
   if (text[start] !== "<") return null;

   // Try to match various HTML patterns
   const remaining = text.slice(start);

   // Open tag
   const openTagMatch =
      /^<[a-zA-Z][a-zA-Z0-9-]*(?:\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*(?:\s*=\s*(?:[^"'=<>`\s]+|'[^']*'|"[^"]*"))?)*\s*\/?>/.exec(
         remaining,
      );
   if (openTagMatch) {
      return {
         type: "htmlInline",
         value: openTagMatch[0],
         start,
         end: start + openTagMatch[0].length,
      };
   }

   // Close tag
   const closeTagMatch = /^<\/[a-zA-Z][a-zA-Z0-9-]*\s*>/.exec(remaining);
   if (closeTagMatch) {
      return {
         type: "htmlInline",
         value: closeTagMatch[0],
         start,
         end: start + closeTagMatch[0].length,
      };
   }

   // Comment
   const commentMatch = /^<!--(?!-?>)(?:[^-]|-(?!-))*-->/.exec(remaining);
   if (commentMatch) {
      return {
         type: "htmlInline",
         value: commentMatch[0],
         start,
         end: start + commentMatch[0].length,
      };
   }

   // Processing instruction
   const piMatch = /^<\?.*?\?>/.exec(remaining);
   if (piMatch) {
      return {
         type: "htmlInline",
         value: piMatch[0],
         start,
         end: start + piMatch[0].length,
      };
   }

   // Declaration
   const declMatch = /^<![A-Z]+\s+[^>]*>/.exec(remaining);
   if (declMatch) {
      return {
         type: "htmlInline",
         value: declMatch[0],
         start,
         end: start + declMatch[0].length,
      };
   }

   // CDATA
   const cdataMatch = /^<!\[CDATA\[[\s\S]*?\]\]>/.exec(remaining);
   if (cdataMatch) {
      return {
         type: "htmlInline",
         value: cdataMatch[0],
         start,
         end: start + cdataMatch[0].length,
      };
   }

   return null;
}

/**
 * Parses a delimiter run (* or _) starting at the given position.
 */
function parseDelimiterRun(
   text: string,
   start: number,
   char: "*" | "_",
): (InlineToken & { type: "delimiterRun" }) | null {
   let count = 0;
   let i = start;
   while (i < text.length && text[i] === char) {
      count++;
      i++;
   }

   if (count === 0) return null;

   // Determine if it can open/close emphasis
   const before = start > 0 ? text[start - 1] : " ";
   const after = i < text.length ? text[i] : " ";

   const beforeWhitespace = /\s/.test(before ?? " ");
   const afterWhitespace = /\s/.test(after ?? " ");
   const beforePunct = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(before ?? "");
   const afterPunct = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(after ?? "");

   // Left-flanking: not followed by whitespace, and either not followed by punctuation
   // or preceded by whitespace or punctuation
   const leftFlanking =
      !afterWhitespace && (!afterPunct || beforeWhitespace || beforePunct);

   // Right-flanking: not preceded by whitespace, and either not preceded by punctuation
   // or followed by whitespace or punctuation
   const rightFlanking =
      !beforeWhitespace && (!beforePunct || afterWhitespace || afterPunct);

   let canOpen: boolean;
   let canClose: boolean;

   if (char === "*") {
      canOpen = leftFlanking;
      canClose = rightFlanking;
   } else {
      // _ has additional restrictions
      canOpen = leftFlanking && (!rightFlanking || beforePunct);
      canClose = rightFlanking && (!leftFlanking || afterPunct);
   }

   return {
      type: "delimiterRun",
      char,
      count,
      start,
      end: i,
      canOpen,
      canClose,
   };
}

/**
 * Parses a link destination after ].
 */
function parseLinkDestination(
   text: string,
   start: number,
): (InlineToken & { type: "linkInfo" }) | null {
   if (text[start] !== "(") return null;

   let i = start + 1;

   // Skip whitespace
   while (i < text.length && /\s/.test(text[i] ?? "")) {
      i++;
   }

   if (i >= text.length) return null;

   let url = "";
   let title: string | undefined;

   // Check for angle-bracketed URL
   if (text[i] === "<") {
      const closeBracket = text.indexOf(">", i + 1);
      if (closeBracket === -1) return null;

      // URL cannot contain < or newlines
      const urlContent = text.slice(i + 1, closeBracket);
      if (urlContent.includes("<") || urlContent.includes("\n")) return null;

      url = urlContent;
      i = closeBracket + 1;
   } else {
      // Non-bracketed URL
      let parenDepth = 0;
      const urlStart = i;

      while (i < text.length) {
         const char = text[i];

         if (char === " " || char === "\t" || char === "\n") break;

         if (char === "(") {
            parenDepth++;
         } else if (char === ")") {
            if (parenDepth === 0) break;
            parenDepth--;
         }

         // Backslash escape
         if (char === "\\" && i + 1 < text.length) {
            i += 2;
            continue;
         }

         // Control characters not allowed
         if (char && char.charCodeAt(0) < 32) return null;

         i++;
      }

      url = text.slice(urlStart, i);
   }

   // Skip whitespace
   while (i < text.length && /\s/.test(text[i] ?? "")) {
      i++;
   }

   // Check for title
   if (i < text.length && (text[i] === '"' || text[i] === "'" || text[i] === "(")) {
      const titleChar = text[i] === "(" ? ")" : text[i];
      const titleStart = i + 1;
      i++;

      let escaped = false;
      while (i < text.length) {
         if (escaped) {
            escaped = false;
            i++;
            continue;
         }

         if (text[i] === "\\") {
            escaped = true;
            i++;
            continue;
         }

         if (text[i] === titleChar) {
            title = text.slice(titleStart, i);
            i++;
            break;
         }

         i++;
      }

      if (title === undefined) return null;
   }

   // Skip whitespace
   while (i < text.length && /\s/.test(text[i] ?? "")) {
      i++;
   }

   // Must end with )
   if (text[i] !== ")") return null;

   return {
      type: "linkInfo",
      url: decodeHtmlEntities(unescapeMarkdown(url)),
      title: title ? decodeHtmlEntities(unescapeMarkdown(title)) : undefined,
      start,
      end: i + 1,
   };
}

// =============================================================================
// Emphasis Processing
// =============================================================================

interface EmphasisMatch {
   openerIdx: number;
   closerIdx: number;
   count: number; // 1 for emphasis, 2 for strong
}

/**
 * Finds all emphasis matches in the delimiter list.
 */
function findEmphasisMatches(delimiters: Delimiter[]): EmphasisMatch[] {
   const matches: EmphasisMatch[] = [];

   // Process from innermost to outermost
   for (let closeIdx = 0; closeIdx < delimiters.length; closeIdx++) {
      const closer = delimiters[closeIdx];
      if (!closer || !closer.canClose || closer.count === 0) continue;

      // Find matching opener (search backwards)
      for (let openIdx = closeIdx - 1; openIdx >= 0; openIdx--) {
         const opener = delimiters[openIdx];
         if (!opener || !opener.canOpen || opener.count === 0) continue;

         if (opener.char !== closer.char) continue;

         // Sum rule for emphasis
         if (
            (opener.canOpen && opener.canClose) ||
            (closer.canOpen && closer.canClose)
         ) {
            if ((opener.count + closer.count) % 3 === 0) {
               if (opener.count % 3 !== 0 || closer.count % 3 !== 0) {
                  continue;
               }
            }
         }

         // Match found - use strong if both have >= 2, else emphasis
         const useStrong = opener.count >= 2 && closer.count >= 2;
         const used = useStrong ? 2 : 1;

         matches.push({
            openerIdx: openIdx,
            closerIdx: closeIdx,
            count: used,
         });

         opener.count -= used;
         closer.count -= used;

         // Continue looking for more matches with same closer if it has remaining count
         if (closer.count > 0) {
            // Don't break, let outer loop handle it
         }
         break;
      }
   }

   return matches;
}

// =============================================================================
// Token to Node Conversion
// =============================================================================

/**
 * Converts tokens to AST nodes with proper emphasis handling.
 */
function tokensToNodes(
   tokens: InlineToken[],
   references: Map<string, { url: string; title?: string }>,
): InlineNode[] {
   // First pass: identify delimiter tokens and build delimiter list
   const delimiters: (Delimiter & { tokenIndex: number })[] = [];

   for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token?.type === "delimiterRun") {
         delimiters.push({
            char: token.char,
            count: token.count,
            position: i,
            canOpen: token.canOpen,
            canClose: token.canClose,
            active: true,
            tokenIndex: i,
         });
      }
   }

   // Find emphasis matches
   const matches = findEmphasisMatches(delimiters);

   // Sort matches by opener position (process inner matches first)
   matches.sort((a, b) => b.openerIdx - a.openerIdx);

   // Convert tokens to nodes, applying emphasis matches
   const nodes: InlineNode[] = [];
   const bracketStack: Bracket[] = [];

   // Track which delimiter tokens have been used
   const usedDelimiters = new Map<number, number[]>(); // tokenIndex -> [count1, count2, ...]

   for (const match of matches) {
      const opener = delimiters[match.openerIdx];
      const closer = delimiters[match.closerIdx];
      if (!opener || !closer) continue;

      const openerUsed = usedDelimiters.get(opener.tokenIndex) ?? [];
      openerUsed.push(match.count);
      usedDelimiters.set(opener.tokenIndex, openerUsed);

      const closerUsed = usedDelimiters.get(closer.tokenIndex) ?? [];
      closerUsed.push(match.count);
      usedDelimiters.set(closer.tokenIndex, closerUsed);
   }

   // Build node tree with emphasis
   function processTokenRange(
      start: number,
      end: number,
      emphasisStack: { char: "*" | "_"; count: number; startNodeIdx: number }[],
   ): InlineNode[] {
      const result: InlineNode[] = [];
      let i = start;

      while (i < end) {
         const token = tokens[i];
         if (!token) {
            i++;
            continue;
         }

         switch (token.type) {
            case "text":
               result.push({
                  type: "text",
                  value: decodeHtmlEntities(unescapeMarkdown(token.value)),
               });
               break;

            case "code":
               result.push({
                  type: "codeSpan",
                  value: token.value,
               });
               break;

            case "hardBreak":
               result.push({ type: "hardBreak" });
               break;

            case "softBreak":
               result.push({ type: "softBreak" });
               break;

            case "autolink":
               result.push({
                  type: "link",
                  url: token.url,
                  children: [{ type: "text", value: token.url.replace(/^mailto:/, "") }],
               });
               break;

            case "htmlInline":
               result.push({
                  type: "htmlInline",
                  value: token.value,
               });
               break;

            case "delimiterRun": {
               // Check if this delimiter is part of a match
               const delimIdx = delimiters.findIndex((d) => d.tokenIndex === i);
               const delim = delimiters[delimIdx];
               
               if (delim) {
                  // Check for opening emphasis
                  let remaining = token.count;
                  
                  for (const match of matches) {
                     if (match.openerIdx === delimIdx && remaining >= match.count) {
                        // This is an opener - find the closer and wrap content
                        const closerDelim = delimiters[match.closerIdx];
                        if (closerDelim) {
                           const closerTokenIdx = closerDelim.tokenIndex;
                           
                           // Recursively process content between opener and closer
                           const innerNodes = processTokenRange(i + 1, closerTokenIdx, []);
                           
                           const emphNode = match.count === 2
                              ? { type: "strong" as const, children: innerNodes, marker: (token.char + token.char) as "**" | "__" }
                              : { type: "emphasis" as const, children: innerNodes, marker: token.char as "*" | "_" };
                           
                           result.push(emphNode);
                           remaining -= match.count;
                           
                           // Skip to after closer
                           i = closerTokenIdx;
                        }
                     }
                  }
                  
                  // Output any remaining delimiters as text
                  if (remaining > 0) {
                     result.push({ type: "text", value: token.char.repeat(remaining) });
                  }
               } else {
                  // Not in delimiter list, output as text
                  result.push({ type: "text", value: token.char.repeat(token.count) });
               }
               break;
            }

            case "openBracket":
               bracketStack.push({
                  position: result.length,
                  isImage: token.isImage,
                  delimiterIndex: -1,
                  active: true,
               });
               result.push({ type: "text", value: token.isImage ? "![" : "[" });
               break;

            case "closeBracket": {
               let matched = false;
               for (let j = bracketStack.length - 1; j >= 0; j--) {
                  const bracket = bracketStack[j];
                  if (!bracket || !bracket.active) continue;

                  const nextToken = tokens[i + 1];
                  if (nextToken?.type === "linkInfo") {
                     const linkContent = result.slice(bracket.position + 1);
                     result.length = bracket.position;

                     let url = nextToken.url;
                     let title = nextToken.title;

                     if (!url && title) {
                        const ref = references.get(normalizeLabel(title));
                        if (ref) {
                           url = ref.url;
                           title = ref.title;
                        }
                     }

                     if (bracket.isImage) {
                        const alt = linkContent
                           .map((n) => {
                              if (n.type === "text") return n.value;
                              if (n.type === "codeSpan") return n.value;
                              return "";
                           })
                           .join("");

                        result.push({
                           type: "image",
                           alt,
                           url,
                           title,
                        });
                     } else {
                        result.push({
                           type: "link",
                           url,
                           title,
                           children: linkContent,
                        });
                     }

                     i++;
                     matched = true;
                  } else {
                     const linkText = result
                        .slice(bracket.position + 1)
                        .map((n) => (n.type === "text" ? n.value : ""))
                        .join("");

                     const ref = references.get(normalizeLabel(linkText));
                     if (ref) {
                        const linkContent = result.slice(bracket.position + 1);
                        result.length = bracket.position;

                        if (bracket.isImage) {
                           result.push({
                              type: "image",
                              alt: linkText,
                              url: ref.url,
                              title: ref.title,
                           });
                        } else {
                           result.push({
                              type: "link",
                              url: ref.url,
                              title: ref.title,
                              children: linkContent,
                           });
                        }
                        matched = true;
                     }
                  }

                  bracket.active = false;
                  break;
               }

               if (!matched) {
                  result.push({ type: "text", value: "]" });
               }
               break;
            }

            case "linkInfo":
               result.push({ type: "text", value: `(${token.url})` });
               break;
         }

         i++;
      }

      return mergeTextNodes(result);
   }

   return processTokenRange(0, tokens.length, []);
}

/**
 * Merges adjacent text nodes.
 */
function mergeTextNodes(nodes: InlineNode[]): InlineNode[] {
   const result: InlineNode[] = [];

   for (const node of nodes) {
      if (node.type === "text" && result.length > 0) {
         const last = result[result.length - 1];
         if (last?.type === "text") {
            last.value += node.value;
            continue;
         }
      }
      result.push(node);
   }

   return result;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Parses inline content and returns AST nodes.
 *
 * @param text - The inline content to parse
 * @param references - Link reference definitions
 * @returns Array of inline nodes
 */
export function parseInline(
   text: string,
   references: Map<string, { url: string; title?: string }> = new Map(),
): InlineNode[] {
   if (!text) return [];

   const tokens = tokenize(text);
   return tokensToNodes(tokens, references);
}

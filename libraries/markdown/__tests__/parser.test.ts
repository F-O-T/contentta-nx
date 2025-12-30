import { describe, expect, it } from "bun:test";
import {
   countWords,
   extractText,
   getCodeBlocks,
   getHeadings,
   getImages,
   getLinks,
   isValidMarkdown,
   parse,
   parseBuffer,
   parseOrThrow,
   parseToAst,
} from "../src/index.ts";

describe("parse", () => {
   describe("basic parsing", () => {
      it("parses empty content", () => {
         const result = parse("");
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.root.children).toEqual([]);
         }
      });

      it("parses whitespace-only content", () => {
         const result = parse("   \n\n   ");
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.root.children).toEqual([]);
         }
      });

      it("parses simple paragraph", () => {
         const result = parse("Hello, world!");
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.root.children).toHaveLength(1);
            expect(result.data.root.children[0]?.type).toBe("paragraph");
         }
      });

      it("returns line ending info", () => {
         const resultLf = parse("Hello\nworld");
         expect(resultLf.success).toBe(true);
         if (resultLf.success) {
            expect(resultLf.data.lineEnding).toBe("\n");
         }

         const resultCrlf = parse("Hello\r\nworld");
         expect(resultCrlf.success).toBe(true);
         if (resultCrlf.success) {
            expect(resultCrlf.data.lineEnding).toBe("\r\n");
         }
      });
   });

   describe("headings", () => {
      it("parses ATX headings", () => {
         const doc = parseOrThrow("# Heading 1\n## Heading 2\n###### Heading 6");
         expect(doc.root.children).toHaveLength(3);

         const h1 = doc.root.children[0];
         expect(h1?.type).toBe("heading");
         if (h1?.type === "heading") {
            expect(h1.level).toBe(1);
            expect(h1.style).toBe("atx");
         }

         const h6 = doc.root.children[2];
         if (h6?.type === "heading") {
            expect(h6.level).toBe(6);
         }
      });

      it("parses ATX headings with trailing hashes", () => {
         const doc = parseOrThrow("# Heading #");
         const heading = doc.root.children[0];
         if (heading?.type === "heading") {
            expect(heading.children[0]).toEqual({
               type: "text",
               value: "Heading",
            });
         }
      });

      it("parses setext headings", () => {
         const doc = parseOrThrow("Heading 1\n=========\n\nHeading 2\n---------");
         expect(doc.root.children).toHaveLength(2);

         const h1 = doc.root.children[0];
         if (h1?.type === "heading") {
            expect(h1.level).toBe(1);
            expect(h1.style).toBe("setext");
         }

         const h2 = doc.root.children[1];
         if (h2?.type === "heading") {
            expect(h2.level).toBe(2);
            expect(h2.style).toBe("setext");
         }
      });
   });

   describe("paragraphs", () => {
      it("parses multiple paragraphs", () => {
         const doc = parseOrThrow("First paragraph.\n\nSecond paragraph.");
         expect(doc.root.children).toHaveLength(2);
         expect(doc.root.children[0]?.type).toBe("paragraph");
         expect(doc.root.children[1]?.type).toBe("paragraph");
      });

      it("combines lines into single paragraph", () => {
         const doc = parseOrThrow("Line 1\nLine 2\nLine 3");
         expect(doc.root.children).toHaveLength(1);
         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            // Text nodes with soft breaks between
            expect(para.children.length).toBeGreaterThan(1);
         }
      });
   });

   describe("code blocks", () => {
      it("parses fenced code blocks with backticks", () => {
         const doc = parseOrThrow("```js\nconsole.log('hi');\n```");
         const codeBlock = doc.root.children[0];
         expect(codeBlock?.type).toBe("codeBlock");
         if (codeBlock?.type === "codeBlock") {
            expect(codeBlock.lang).toBe("js");
            expect(codeBlock.value).toBe("console.log('hi');");
            expect(codeBlock.style).toBe("fenced");
            expect(codeBlock.fence).toBe("`");
         }
      });

      it("parses fenced code blocks with tildes", () => {
         const doc = parseOrThrow("~~~python\nprint('hello')\n~~~");
         const codeBlock = doc.root.children[0];
         if (codeBlock?.type === "codeBlock") {
            expect(codeBlock.lang).toBe("python");
            expect(codeBlock.fence).toBe("~");
         }
      });

      it("parses indented code blocks", () => {
         const doc = parseOrThrow("    function foo() {\n        return 1;\n    }");
         const codeBlock = doc.root.children[0];
         expect(codeBlock?.type).toBe("codeBlock");
         if (codeBlock?.type === "codeBlock") {
            expect(codeBlock.style).toBe("indented");
         }
      });
   });

   describe("blockquotes", () => {
      it("parses simple blockquotes", () => {
         const doc = parseOrThrow("> This is a quote.");
         expect(doc.root.children[0]?.type).toBe("blockquote");
      });

      it("parses nested blockquotes", () => {
         const doc = parseOrThrow("> Level 1\n> > Level 2");
         const blockquote = doc.root.children[0];
         if (blockquote?.type === "blockquote") {
            expect(blockquote.children.length).toBeGreaterThan(0);
         }
      });

      it("handles lazy continuation", () => {
         const doc = parseOrThrow("> First line\nSecond line (lazy)");
         expect(doc.root.children).toHaveLength(1);
         expect(doc.root.children[0]?.type).toBe("blockquote");
      });
   });

   describe("lists", () => {
      it("parses unordered lists", () => {
         const doc = parseOrThrow("- Item 1\n- Item 2\n- Item 3");
         const list = doc.root.children[0];
         expect(list?.type).toBe("list");
         if (list?.type === "list") {
            expect(list.ordered).toBe(false);
            expect(list.children).toHaveLength(3);
         }
      });

      it("parses ordered lists", () => {
         const doc = parseOrThrow("1. First\n2. Second\n3. Third");
         const list = doc.root.children[0];
         if (list?.type === "list") {
            expect(list.ordered).toBe(true);
            expect(list.start).toBe(1);
         }
      });

      it("handles different list markers", () => {
         const asterisk = parseOrThrow("* Item");
         const plus = parseOrThrow("+ Item");
         const dash = parseOrThrow("- Item");

         expect(asterisk.root.children[0]?.type).toBe("list");
         expect(plus.root.children[0]?.type).toBe("list");
         expect(dash.root.children[0]?.type).toBe("list");
      });
   });

   describe("thematic breaks", () => {
      it("parses thematic breaks with dashes", () => {
         const doc = parseOrThrow("---");
         expect(doc.root.children[0]?.type).toBe("thematicBreak");
         const tb = doc.root.children[0];
         if (tb?.type === "thematicBreak") {
            expect(tb.marker).toBe("-");
         }
      });

      it("parses thematic breaks with asterisks", () => {
         const doc = parseOrThrow("***");
         const tb = doc.root.children[0];
         if (tb?.type === "thematicBreak") {
            expect(tb.marker).toBe("*");
         }
      });

      it("parses thematic breaks with underscores", () => {
         const doc = parseOrThrow("___");
         const tb = doc.root.children[0];
         if (tb?.type === "thematicBreak") {
            expect(tb.marker).toBe("_");
         }
      });

      it("handles thematic breaks with spaces", () => {
         const doc = parseOrThrow("- - -");
         expect(doc.root.children[0]?.type).toBe("thematicBreak");
      });
   });

   describe("inline elements", () => {
      it("parses emphasis", () => {
         const doc = parseOrThrow("*emphasis* and _more emphasis_");
         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            const emph = para.children.find((c) => c.type === "emphasis");
            expect(emph).toBeDefined();
         }
      });

      it("parses strong emphasis", () => {
         const doc = parseOrThrow("**strong** and __more strong__");
         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            const strong = para.children.find((c) => c.type === "strong");
            expect(strong).toBeDefined();
         }
      });

      it("parses code spans", () => {
         const doc = parseOrThrow("Inline `code` here");
         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            const code = para.children.find((c) => c.type === "codeSpan");
            expect(code).toBeDefined();
            if (code?.type === "codeSpan") {
               expect(code.value).toBe("code");
            }
         }
      });

      it("parses links", () => {
         const doc = parseOrThrow("[Example](https://example.com)");
         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            const link = para.children.find((c) => c.type === "link");
            expect(link).toBeDefined();
            if (link?.type === "link") {
               expect(link.url).toBe("https://example.com");
            }
         }
      });

      it("parses images", () => {
         const doc = parseOrThrow("![Alt text](image.png)");
         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            const image = para.children.find((c) => c.type === "image");
            expect(image).toBeDefined();
            if (image?.type === "image") {
               expect(image.alt).toBe("Alt text");
               expect(image.url).toBe("image.png");
            }
         }
      });
   });
});

describe("parseOrThrow", () => {
   it("returns document on success", () => {
      const doc = parseOrThrow("# Hello");
      expect(doc.root.type).toBe("document");
      expect(doc.root.children.length).toBeGreaterThan(0);
   });
});

describe("parseBuffer", () => {
   it("parses UTF-8 buffer", () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode("# Hello World");
      const result = parseBuffer(buffer);
      expect(result.success).toBe(true);
   });

   it("handles UTF-8 BOM", () => {
      const content = "# Hello";
      const encoder = new TextEncoder();
      const encoded = encoder.encode(content);
      const buffer = new Uint8Array([0xef, 0xbb, 0xbf, ...encoded]);
      const result = parseBuffer(buffer);
      expect(result.success).toBe(true);
   });
});

describe("convenience functions", () => {
   describe("parseToAst", () => {
      it("returns just the root node", () => {
         const root = parseToAst("# Hello");
         expect(root.type).toBe("document");
      });
   });

   describe("isValidMarkdown", () => {
      it("returns true for valid markdown", () => {
         expect(isValidMarkdown("# Hello")).toBe(true);
         expect(isValidMarkdown("Just text")).toBe(true);
         expect(isValidMarkdown("")).toBe(true);
      });
   });

   describe("extractText", () => {
      it("extracts plain text from markdown", () => {
         expect(extractText("**Hello** *world*")).toBe("Hello world");
         expect(extractText("# Heading")).toBe("Heading");
         expect(extractText("[Link](url)")).toBe("Link");
      });
   });

   describe("countWords", () => {
      it("counts words correctly", () => {
         expect(countWords("Hello world")).toBe(2);
         expect(countWords("**One** two *three*")).toBe(3);
         expect(countWords("")).toBe(0);
      });
   });

   describe("getHeadings", () => {
      it("extracts all headings", () => {
         const headings = getHeadings("# Title\n## Section\n### Subsection");
         expect(headings).toHaveLength(3);
         expect(headings[0]).toEqual({ level: 1, text: "Title" });
         expect(headings[1]).toEqual({ level: 2, text: "Section" });
      });
   });

   describe("getLinks", () => {
      it("extracts all links", () => {
         const links = getLinks("[A](a.com) and [B](b.com)");
         expect(links).toHaveLength(2);
         expect(links[0]?.url).toBe("a.com");
         expect(links[1]?.url).toBe("b.com");
      });
   });

   describe("getImages", () => {
      it("extracts all images", () => {
         const images = getImages("![A](a.png) ![B](b.png)");
         expect(images).toHaveLength(2);
         expect(images[0]?.alt).toBe("A");
         expect(images[1]?.alt).toBe("B");
      });
   });

   describe("getCodeBlocks", () => {
      it("extracts all code blocks", () => {
         const blocks = getCodeBlocks("```js\ncode1\n```\n\n```py\ncode2\n```");
         expect(blocks).toHaveLength(2);
         expect(blocks[0]?.lang).toBe("js");
         expect(blocks[1]?.lang).toBe("py");
      });
   });
});

describe("position tracking", () => {
   it("includes positions by default", () => {
      const doc = parseOrThrow("# Hello");
      const heading = doc.root.children[0];
      expect(heading?.position).toBeDefined();
      if (heading?.position) {
         expect(heading.position.startLine).toBe(1);
      }
   });

   it("can disable positions", () => {
      const doc = parseOrThrow("# Hello", { positions: false });
      const heading = doc.root.children[0];
      expect(heading?.position).toBeUndefined();
   });
});

describe("source preservation", () => {
   it("does not preserve source by default", () => {
      const doc = parseOrThrow("# Hello");
      expect(doc.source).toBeUndefined();
   });

   it("preserves source when requested", () => {
      const content = "# Hello";
      const doc = parseOrThrow(content, { preserveSource: true });
      expect(doc.source).toBe(content);
   });
});

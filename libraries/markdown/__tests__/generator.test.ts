import { describe, expect, it } from "bun:test";
import {
   createGenerator,
   generate,
   generateBlockquoteString,
   generateCodeBlockString,
   generateEmphasisString,
   generateHeadingString,
   generateImageString,
   generateInlineCodeString,
   generateLinkString,
   generateListString,
   generateNode,
   generateStrongString,
   parseOrThrow,
} from "../src/index.ts";
import type {
   CodeBlockNode,
   HeadingNode,
   LinkNode,
   ParagraphNode,
   TextNode,
} from "../src/schemas.ts";

describe("generate", () => {
   describe("round-trip parsing", () => {
      it("round-trips simple paragraph", () => {
         const input = "Hello, world!";
         const doc = parseOrThrow(input);
         const output = generate(doc);
         expect(output.trim()).toBe(input);
      });

      it("round-trips heading", () => {
         const input = "# Hello World";
         const doc = parseOrThrow(input);
         const output = generate(doc);
         expect(output).toBe(input);
      });

      it("round-trips code block", () => {
         const input = "```javascript\nconsole.log('hi');\n```";
         const doc = parseOrThrow(input);
         const output = generate(doc);
         expect(output).toBe(input);
      });

      it("round-trips blockquote", () => {
         const input = "> This is a quote";
         const doc = parseOrThrow(input);
         const output = generate(doc);
         expect(output.trim()).toBe(input);
      });

      it("round-trips unordered list", () => {
         const input = "- Item 1\n- Item 2";
         const doc = parseOrThrow(input);
         const output = generate(doc);
         expect(output.trim()).toBe(input);
      });

      it("round-trips ordered list", () => {
         const input = "1. First\n2. Second";
         const doc = parseOrThrow(input);
         const output = generate(doc);
         expect(output.trim()).toBe(input);
      });
   });

   describe("options", () => {
      it("respects lineEnding option", () => {
         const doc = parseOrThrow("Para 1\n\nPara 2");
         const output = generate(doc, { lineEnding: "\r\n" });
         expect(output).toContain("\r\n\r\n");
      });

      it("respects fence option", () => {
         const doc = parseOrThrow("```\ncode\n```");
         const output = generate(doc, { fence: "~" });
         expect(output).toContain("~~~");
      });

      it("respects emphasis option", () => {
         const doc = parseOrThrow("*text*");
         // The output should preserve the original marker from the AST
         const output = generate(doc);
         expect(output).toContain("*text*");
      });
   });
});

describe("generateNode", () => {
   it("generates heading node", () => {
      const node: HeadingNode = {
         type: "heading",
         level: 2,
         children: [{ type: "text", value: "Title" }],
         style: "atx",
      };
      expect(generateNode(node)).toBe("## Title");
   });

   it("generates paragraph node", () => {
      const node: ParagraphNode = {
         type: "paragraph",
         children: [{ type: "text", value: "Hello world" }],
      };
      expect(generateNode(node)).toBe("Hello world");
   });

   it("generates code block node", () => {
      const node: CodeBlockNode = {
         type: "codeBlock",
         value: "const x = 1;",
         lang: "js",
         style: "fenced",
         fence: "`",
         fenceLength: 3,
      };
      expect(generateNode(node)).toBe("```js\nconst x = 1;\n```");
   });

   it("generates link node", () => {
      const node: LinkNode = {
         type: "link",
         url: "https://example.com",
         children: [{ type: "text", value: "Example" }],
      };
      expect(generateNode(node)).toBe("[Example](https://example.com)");
   });

   it("generates text node", () => {
      const node: TextNode = {
         type: "text",
         value: "Plain text",
      };
      expect(generateNode(node)).toBe("Plain text");
   });
});

describe("createGenerator", () => {
   it("builds markdown incrementally", () => {
      const gen = createGenerator();

      gen.addNode({
         type: "heading",
         level: 1,
         children: [{ type: "text", value: "Title" }],
         style: "atx",
      });

      gen.addNode({
         type: "paragraph",
         children: [{ type: "text", value: "Content here." }],
      });

      const output = gen.toString();
      expect(output).toContain("# Title");
      expect(output).toContain("Content here.");
   });

   it("provides stream output", async () => {
      const gen = createGenerator();

      gen.addNode({
         type: "paragraph",
         children: [{ type: "text", value: "Line 1" }],
      });

      gen.addNode({
         type: "paragraph",
         children: [{ type: "text", value: "Line 2" }],
      });

      const stream = gen.toStream();
      const reader = stream.getReader();
      const chunks: string[] = [];

      while (true) {
         const { done, value } = await reader.read();
         if (done) break;
         chunks.push(value);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join("")).toContain("Line 1");
   });
});

describe("convenience generators", () => {
   describe("generateHeadingString", () => {
      it("generates ATX headings", () => {
         expect(generateHeadingString(1, "Title")).toBe("# Title");
         expect(generateHeadingString(3, "Section")).toBe("### Section");
         expect(generateHeadingString(6, "Small")).toBe("###### Small");
      });

      it("generates setext headings", () => {
         expect(generateHeadingString(1, "Title", "setext")).toBe(
            "Title\n=====",
         );
         expect(generateHeadingString(2, "Section", "setext")).toBe(
            "Section\n-------",
         );
      });

      it("falls back to ATX for levels > 2 with setext", () => {
         expect(generateHeadingString(3, "Sub", "setext")).toBe("### Sub");
      });
   });

   describe("generateLinkString", () => {
      it("generates basic link", () => {
         expect(generateLinkString("Example", "https://example.com")).toBe(
            "[Example](https://example.com)",
         );
      });

      it("generates link with title", () => {
         expect(
            generateLinkString("Example", "https://example.com", "A title"),
         ).toBe('[Example](https://example.com "A title")');
      });

      it("encodes special URL characters", () => {
         const result = generateLinkString("Link", "https://example.com/path with spaces");
         expect(result).toContain("%20");
      });
   });

   describe("generateImageString", () => {
      it("generates basic image", () => {
         expect(generateImageString("Alt", "image.png")).toBe(
            "![Alt](image.png)",
         );
      });

      it("generates image with title", () => {
         expect(generateImageString("Alt", "image.png", "Title")).toBe(
            '![Alt](image.png "Title")',
         );
      });
   });

   describe("generateCodeBlockString", () => {
      it("generates fenced code block", () => {
         expect(generateCodeBlockString("const x = 1;", "js")).toBe(
            "```js\nconst x = 1;\n```",
         );
      });

      it("generates code block without language", () => {
         expect(generateCodeBlockString("code")).toBe("```\ncode\n```");
      });

      it("generates indented code block", () => {
         expect(generateCodeBlockString("line1\nline2", undefined, "indented")).toBe(
            "    line1\n    line2",
         );
      });
   });

   describe("generateListString", () => {
      it("generates unordered list", () => {
         expect(generateListString(["A", "B", "C"])).toBe("- A\n- B\n- C");
      });

      it("generates ordered list", () => {
         expect(generateListString(["A", "B", "C"], true)).toBe(
            "1. A\n2. B\n3. C",
         );
      });

      it("respects start number", () => {
         expect(generateListString(["A", "B"], true, 5)).toBe("5. A\n6. B");
      });
   });

   describe("generateBlockquoteString", () => {
      it("generates single line blockquote", () => {
         expect(generateBlockquoteString("Quote")).toBe("> Quote");
      });

      it("generates multiline blockquote", () => {
         expect(generateBlockquoteString("Line 1\nLine 2")).toBe(
            "> Line 1\n> Line 2",
         );
      });

      it("handles blank lines", () => {
         expect(generateBlockquoteString("Line 1\n\nLine 2")).toBe(
            "> Line 1\n>\n> Line 2",
         );
      });
   });

   describe("generateEmphasisString", () => {
      it("generates emphasis with asterisk", () => {
         expect(generateEmphasisString("text")).toBe("*text*");
      });

      it("generates emphasis with underscore", () => {
         expect(generateEmphasisString("text", "_")).toBe("_text_");
      });
   });

   describe("generateStrongString", () => {
      it("generates strong with asterisks", () => {
         expect(generateStrongString("text")).toBe("**text**");
      });

      it("generates strong with underscores", () => {
         expect(generateStrongString("text", "__")).toBe("__text__");
      });
   });

   describe("generateInlineCodeString", () => {
      it("generates inline code", () => {
         expect(generateInlineCodeString("code")).toBe("`code`");
      });

      it("handles backticks in content", () => {
         expect(generateInlineCodeString("code with ` backtick")).toBe(
            "`` code with ` backtick ``",
         );
      });

      it("handles multiple backticks in content", () => {
         const result = generateInlineCodeString("a `` b ``` c");
         expect(result.startsWith("````")).toBe(true);
      });
   });
});

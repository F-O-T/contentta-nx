import { describe, expect, it } from "bun:test";
import { generate, parse, parseOrThrow } from "../src/index.ts";

describe("integration tests", () => {
   describe("complex documents", () => {
      it("parses a full document with multiple elements", () => {
         const markdown = `# Main Title

This is an introductory paragraph with **bold** and *italic* text.

## Features

- First feature
- Second feature with \`inline code\`
- Third feature

### Code Example

\`\`\`javascript
function hello() {
   console.log("Hello, world!");
}
\`\`\`

> This is a blockquote
> that spans multiple lines.

1. First step
2. Second step
3. Third step

---

For more info, see [our docs](https://example.com).

![Logo](logo.png "Company Logo")
`;

         const result = parse(markdown);
         expect(result.success).toBe(true);

         if (!result.success) return;

         const doc = result.data;
         const children = doc.root.children;

         // Count different block types
         const headings = children.filter((c) => c.type === "heading");
         const paragraphs = children.filter((c) => c.type === "paragraph");
         const lists = children.filter((c) => c.type === "list");
         const codeBlocks = children.filter((c) => c.type === "codeBlock");
         const blockquotes = children.filter((c) => c.type === "blockquote");
         const thematicBreaks = children.filter((c) => c.type === "thematicBreak");

         expect(headings.length).toBe(3); // h1, h2, h3
         expect(paragraphs.length).toBeGreaterThan(0);
         expect(lists.length).toBe(2); // unordered and ordered
         expect(codeBlocks.length).toBe(1);
         expect(blockquotes.length).toBe(1);
         expect(thematicBreaks.length).toBe(1);
      });

      it("handles nested structures", () => {
         const markdown = `> # Quoted Heading
>
> - Item 1
> - Item 2
>
> \`\`\`
> code
> \`\`\`
`;

         const doc = parseOrThrow(markdown);
         const blockquote = doc.root.children[0];

         expect(blockquote?.type).toBe("blockquote");
         if (blockquote?.type === "blockquote") {
            expect(blockquote.children.length).toBeGreaterThan(0);

            const heading = blockquote.children.find((c) => c.type === "heading");
            const list = blockquote.children.find((c) => c.type === "list");

            expect(heading).toBeDefined();
            expect(list).toBeDefined();
         }
      });
   });

   describe("round-trip parsing", () => {
      const testCases = [
         { name: "simple paragraph", markdown: "Hello, world!" },
         { name: "heading", markdown: "# Title" },
         { name: "emphasis", markdown: "*emphasized text*" },
         { name: "strong", markdown: "**strong text**" },
         { name: "link", markdown: "[Link](https://example.com)" },
         { name: "image", markdown: "![Alt](image.png)" },
         { name: "code span", markdown: "`inline code`" },
         { name: "blockquote", markdown: "> Quote" },
         { name: "unordered list", markdown: "- Item 1\n- Item 2" },
         { name: "ordered list", markdown: "1. First\n2. Second" },
         { name: "thematic break", markdown: "---" },
         {
            name: "fenced code",
            markdown: "```js\nconst x = 1;\n```",
         },
      ];

      for (const { name, markdown } of testCases) {
         it(`round-trips ${name}`, () => {
            const doc = parseOrThrow(markdown);
            const output = generate(doc);

            // Parse the output again
            const reparsed = parseOrThrow(output);

            // Compare structure (ignoring positions)
            const stripPositions = (obj: unknown): unknown => {
               if (Array.isArray(obj)) {
                  return obj.map(stripPositions);
               }
               if (obj && typeof obj === "object") {
                  const result: Record<string, unknown> = {};
                  for (const [key, value] of Object.entries(obj)) {
                     if (key !== "position") {
                        result[key] = stripPositions(value);
                     }
                  }
                  return result;
               }
               return obj;
            };

            expect(stripPositions(reparsed.root)).toEqual(
               stripPositions(doc.root),
            );
         });
      }
   });

   describe("edge cases", () => {
      it("handles empty lines between blocks", () => {
         const markdown = "# Title\n\n\n\n\nParagraph";
         const doc = parseOrThrow(markdown);
         expect(doc.root.children).toHaveLength(2);
      });

      it("handles Windows line endings", () => {
         const markdown = "# Title\r\n\r\nParagraph";
         const doc = parseOrThrow(markdown);
         expect(doc.root.children).toHaveLength(2);
         expect(doc.lineEnding).toBe("\r\n");
      });

      it("handles mixed line endings", () => {
         const markdown = "# Title\n\r\nParagraph\r\n";
         const doc = parseOrThrow(markdown);
         expect(doc.root.children.length).toBeGreaterThan(0);
      });

      it("handles Unicode content", () => {
         const markdown = "# 日本語のタイトル\n\nCafé résumé naïve";
         const doc = parseOrThrow(markdown);

         const heading = doc.root.children[0];
         if (heading?.type === "heading") {
            expect(heading.children[0]).toEqual({
               type: "text",
               value: "日本語のタイトル",
            });
         }
      });

      it("handles special characters in code", () => {
         const markdown = "```\n<script>alert('xss')</script>\n```";
         const doc = parseOrThrow(markdown);

         const codeBlock = doc.root.children[0];
         if (codeBlock?.type === "codeBlock") {
            expect(codeBlock.value).toBe("<script>alert('xss')</script>");
         }
      });

      it("handles deeply nested lists", () => {
         const markdown = `- Level 1
   - Level 2
      - Level 3`;

         const doc = parseOrThrow(markdown);
         expect(doc.root.children[0]?.type).toBe("list");
      });

      it("handles backslash escapes", () => {
         const markdown = "\\*not italic\\* and \\[not a link\\]";
         const doc = parseOrThrow(markdown);

         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            const text = para.children
               .filter((c) => c.type === "text")
               .map((c) => (c.type === "text" ? c.value : ""))
               .join("");

            expect(text).toContain("*not italic*");
            expect(text).toContain("[not a link]");
         }
      });
   });

   describe("link reference definitions", () => {
      it("resolves reference links", () => {
         const markdown = `[Example][ref]

[ref]: https://example.com "Title"`;

         const doc = parseOrThrow(markdown);
         const para = doc.root.children[0];

         if (para?.type === "paragraph") {
            const link = para.children.find((c) => c.type === "link");
            if (link?.type === "link") {
               expect(link.url).toBe("https://example.com");
               expect(link.title).toBe("Title");
            }
         }
      });

      it("stores references in document", () => {
         const markdown = `[ref]: https://example.com

Use [ref] here.`;

         const doc = parseOrThrow(markdown);
         expect(doc.root.references).toBeDefined();
      });
   });

   describe("HTML blocks", () => {
      it("parses HTML blocks", () => {
         const markdown = `<div class="container">
Content here
</div>`;

         const doc = parseOrThrow(markdown);
         const htmlBlock = doc.root.children[0];

         expect(htmlBlock?.type).toBe("htmlBlock");
      });

      it("handles inline HTML", () => {
         const markdown = "Paragraph with <span>inline</span> HTML.";
         const doc = parseOrThrow(markdown);

         const para = doc.root.children[0];
         if (para?.type === "paragraph") {
            const htmlInline = para.children.find((c) => c.type === "htmlInline");
            expect(htmlInline).toBeDefined();
         }
      });
   });
});

describe("performance", () => {
   it("parses large documents efficiently", () => {
      // Generate a large markdown document
      const lines: string[] = [];
      for (let i = 0; i < 1000; i++) {
         lines.push(`## Section ${i}`);
         lines.push("");
         lines.push(`Paragraph ${i} with **bold** and *italic* text.`);
         lines.push("");
         lines.push("- Item 1");
         lines.push("- Item 2");
         lines.push("");
      }

      const markdown = lines.join("\n");

      const start = performance.now();
      const doc = parseOrThrow(markdown);
      const duration = performance.now() - start;

      // Should parse reasonably quickly (less than 5 seconds for 1000 sections)
      expect(duration).toBeLessThan(5000);
      expect(doc.root.children.length).toBeGreaterThan(0);
   });

   it("generates large documents efficiently", () => {
      // Create a large document structure
      const doc = parseOrThrow("# Title\n\nParagraph");

      // Add many blocks
      for (let i = 0; i < 1000; i++) {
         doc.root.children.push({
            type: "paragraph",
            children: [{ type: "text", value: `Paragraph ${i}` }],
         });
      }

      const start = performance.now();
      const output = generate(doc);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
      expect(output.length).toBeGreaterThan(0);
   });
});

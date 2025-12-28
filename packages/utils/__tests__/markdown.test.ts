import { describe, expect, it } from "bun:test";
import {
   analyzeContentStructure,
   extractTitleFromMarkdown,
   parseMarkdownIntoHtml,
   removeTitleFromMarkdown,
} from "../src/markdown";

describe("markdown utilities", () => {
   describe("removeTitleFromMarkdown", () => {
      it("should remove title from markdown", () => {
         const markdown = "# My Title\n\nSome content here";
         const result = removeTitleFromMarkdown(markdown);
         expect(result).not.toContain("# My Title");
         expect(result).toContain("Some content here");
      });

      it("should handle markdown without title", () => {
         const markdown = "Some content without title";
         const result = removeTitleFromMarkdown(markdown);
         expect(result).toBe("Some content without title");
      });

      it("should handle empty markdown", () => {
         const markdown = "";
         const result = removeTitleFromMarkdown(markdown);
         expect(result).toBe("");
      });

      it("should only remove first h1 title", () => {
         const markdown = "# First Title\n\n# Second Title\n\nContent";
         const result = removeTitleFromMarkdown(markdown);
         expect(result).not.toContain("# First Title");
         expect(result).toContain("# Second Title");
      });
   });

   describe("extractTitleFromMarkdown", () => {
      it("should extract title from markdown", () => {
         const markdown = "# My Title\n\nSome content here";
         const result = extractTitleFromMarkdown(markdown);
         expect(result).toBe("My Title");
      });

      it("should return empty string if no title found", () => {
         const markdown = "Some content without title";
         const result = extractTitleFromMarkdown(markdown);
         expect(result).toBe("");
      });

      it("should handle title with special characters", () => {
         const markdown = "# Title with Special Characters! @#$%";
         const result = extractTitleFromMarkdown(markdown);
         expect(result).toBe("Title with Special Characters! @#$%");
      });

      it("should handle title with leading/trailing spaces", () => {
         const markdown = "#    Spaced Title   ";
         const result = extractTitleFromMarkdown(markdown);
         expect(result).toBe("Spaced Title");
      });

      it("should extract title from middle of document", () => {
         const markdown = "Some intro\n# Main Title\nContent";
         const result = extractTitleFromMarkdown(markdown);
         expect(result).toBe("Main Title");
      });
   });

   describe("parseMarkdownIntoHtml", () => {
      it("should parse markdown into HTML", async () => {
         const markdown = "# Hello\n\nThis is **bold**";
         const result = await parseMarkdownIntoHtml(markdown);
         expect(result).toContain("<h1>");
         expect(result).toContain("<strong>bold</strong>");
      });

      it("should handle empty markdown", async () => {
         const markdown = "";
         const result = await parseMarkdownIntoHtml(markdown);
         expect(result).toBe("");
      });

      it("should parse links", async () => {
         const markdown = "[Link](https://example.com)";
         const result = await parseMarkdownIntoHtml(markdown);
         expect(result).toContain("href=");
         expect(result).toContain("example.com");
      });

      it("should parse lists", async () => {
         const markdown = "- Item 1\n- Item 2";
         const result = await parseMarkdownIntoHtml(markdown);
         expect(result).toContain("<ul>");
         expect(result).toContain("<li>");
      });

      it("should parse code blocks", async () => {
         const markdown = "```js\nconst x = 1;\n```";
         const result = await parseMarkdownIntoHtml(markdown);
         expect(result).toContain("<pre>");
         expect(result).toContain("const x = 1");
      });
   });

   describe("analyzeContentStructure", () => {
      it("should analyze content structure", () => {
         const text =
            "# Title\n\nSome content.\n\n* List item 1\n* List item 2\n\n```code block```";
         const result = analyzeContentStructure({ text });
         expect(result).toHaveProperty("structure");
         expect(result.structure.headings).toBeGreaterThanOrEqual(1);
         expect(result.structure.paragraphs).toBeGreaterThanOrEqual(1);
      });

      it("should handle empty content", () => {
         const text = "";
         const result = analyzeContentStructure({ text });
         expect(result).toHaveProperty("structure");
         expect(typeof result.structure.headings).toBe("number");
         expect(typeof result.structure.paragraphs).toBe("number");
      });

      it("should count headings correctly", () => {
         const text = "# Title 1\n## Title 2\n### Title 3\n\nContent.";
         const result = analyzeContentStructure({ text });
         expect(result.structure.headings).toBe(3);
      });

      it("should count lists correctly", () => {
         const text = "* Item 1\n- Item 2\n+ Item 3";
         const result = analyzeContentStructure({ text });
         expect(result.structure.lists).toBe(3);
      });

      it("should count code blocks correctly", () => {
         const text = "```js\ncode1\n```\n\n```python\ncode2\n```";
         const result = analyzeContentStructure({ text });
         expect(result.structure.codeBlocks).toBe(2);
      });

      it("should count links correctly", () => {
         const text = "[Link1](url1) and [Link2](url2)";
         const result = analyzeContentStructure({ text });
         expect(result.structure.links).toBe(2);
      });

      it("should count images correctly", () => {
         const text = "![Alt1](img1.png) and ![Alt2](img2.jpg)";
         const result = analyzeContentStructure({ text });
         expect(result.structure.images).toBe(2);
      });

      it("should count words correctly", () => {
         const text = "One two three four five";
         const result = analyzeContentStructure({ text });
         expect(result.structure.words).toBe(5);
      });

      it("should count paragraphs correctly", () => {
         const text = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
         const result = analyzeContentStructure({ text });
         expect(result.structure.paragraphs).toBe(3);
      });
   });
});

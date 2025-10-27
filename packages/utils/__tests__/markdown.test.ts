import { describe, it, expect } from "vitest";
import {
   removeTitleFromMarkdown,
   extractTitleFromMarkdown,
   analyzeContentStructure,
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
   });

   describe("analyzeContentStructure", () => {
      it("should analyze content structure", () => {
         const text =
            "# Title\n\nSome content.\n\n* List item 1\n* List item 2\n\n`code block`";
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
   });
});

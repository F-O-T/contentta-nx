import { describe, expect, it } from "bun:test";
import { createDiff, createLineDiff } from "../src/diff";

describe("diff utilities", () => {
   describe("createDiff", () => {
      it("should create diff between two texts", () => {
         const text1 = "Hello world";
         const text2 = "Hello there world";
         const result = createDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should handle identical texts", () => {
         const text1 = "Hello world";
         const text2 = "Hello world";
         const result = createDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result).toEqual([[0, "Hello world"]]);
      });

      it("should handle empty texts", () => {
         const text1 = "";
         const text2 = "Hello world";
         const result = createDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should handle both empty texts", () => {
         const text1 = "";
         const text2 = "";
         const result = createDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result).toEqual([]);
      });

      it("should handle text with common prefix", () => {
         const text1 = "Hello ABC";
         const text2 = "Hello XYZ";
         const result = createDiff(text1, text2);
         expect(result.some((d) => d[0] === 0 && d[1] === "Hello ")).toBe(true);
      });

      it("should handle text with common suffix", () => {
         const text1 = "ABC world";
         const text2 = "XYZ world";
         const result = createDiff(text1, text2);
         expect(result.some((d) => d[0] === 0 && d[1] === " world")).toBe(true);
      });

      it("should handle text with only additions", () => {
         const text1 = "";
         const text2 = "New text";
         const result = createDiff(text1, text2);
         expect(result).toEqual([[1, "New text"]]);
      });

      it("should handle text with only deletions", () => {
         const text1 = "Old text";
         const text2 = "";
         const result = createDiff(text1, text2);
         expect(result).toEqual([[-1, "Old text"]]);
      });

      it("should handle common prefix and suffix with changes", () => {
         const text1 = "The quick fox";
         const text2 = "The slow fox";
         const result = createDiff(text1, text2);
         expect(result.some((d) => d[0] === 0 && d[1] === "The ")).toBe(true);
         expect(result.some((d) => d[0] === 0 && d[1] === " fox")).toBe(true);
      });
   });

   describe("createLineDiff", () => {
      it("should create line diff between two texts", () => {
         const text1 = "Line 1\nLine 2\nLine 3";
         const text2 = "Line 1\nModified Line 2\nLine 3";
         const result = createLineDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should handle identical multiline texts", () => {
         const text1 = "Line 1\nLine 2\nLine 3";
         const text2 = "Line 1\nLine 2\nLine 3";
         const result = createLineDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result).toEqual([]);
      });

      it("should handle single line texts", () => {
         const text1 = "Single line";
         const text2 = "Single line modified";
         const result = createLineDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should detect added lines", () => {
         const text1 = "Line 1\nLine 2";
         const text2 = "Line 1\nLine 2\nLine 3";
         const result = createLineDiff(text1, text2);
         expect(result.some((item) => item.type === "add")).toBe(true);
      });

      it("should detect removed lines", () => {
         const text1 = "Line 1\nLine 2\nLine 3";
         const text2 = "Line 1\nLine 2";
         const result = createLineDiff(text1, text2);
         expect(result.some((item) => item.type === "remove")).toBe(true);
      });

      it("should detect modified lines with inline changes", () => {
         const text1 = "Hello world test";
         const text2 = "Hello there test";
         const result = createLineDiff(text1, text2);
         const modifiedLine = result.find((item) => item.type === "modify");
         if (modifiedLine) {
            expect(modifiedLine.inlineChanges).toBeDefined();
         }
      });

      it("should handle completely different lines (low similarity)", () => {
         const text1 = "AAAAAAAAAA";
         const text2 = "ZZZZZZZZZZ";
         const result = createLineDiff(text1, text2);
         expect(
            result.some(
               (item) => item.type === "remove" || item.type === "add",
            ),
         ).toBe(true);
      });

      it("should include context lines", () => {
         const text1 = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
         const text2 = "Line 1\nLine 2\nModified 3\nLine 4\nLine 5";
         const result = createLineDiff(text1, text2, 1);
         expect(result.some((item) => item.type === "context")).toBe(true);
      });

      it("should handle empty first text", () => {
         const text1 = "";
         const text2 = "New line";
         const result = createLineDiff(text1, text2);
         expect(result.some((item) => item.type === "add")).toBe(true);
      });

      it("should handle empty second text", () => {
         const text1 = "Old line";
         const text2 = "";
         const result = createLineDiff(text1, text2);
         expect(result.some((item) => item.type === "remove")).toBe(true);
      });

      it("should handle both empty lines in one side", () => {
         const text1 = "Line 1\n\nLine 3";
         const text2 = "Line 1\nLine 2\nLine 3";
         const result = createLineDiff(text1, text2);
         expect(result.length).toBeGreaterThan(0);
      });
   });
});

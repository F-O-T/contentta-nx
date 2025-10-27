import { describe, it, expect } from "vitest";
import { createDiff, createLineDiff } from "../src/diff";

describe("diff utilities", () => {
   describe("createDiff", () => {
      it("should create diff between two texts", () => {
         const text1 = "Hello world";
         const text2 = "Hello there world";
         const result = createDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
         expect(result[0]).toHaveProperty("0"); // operation code
         expect(result[0]).toHaveProperty("1"); // text content
      });

      it("should handle identical texts", () => {
         const text1 = "Hello world";
         const text2 = "Hello world";
         const result = createDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThanOrEqual(0);
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
   });

   describe("createLineDiff", () => {
      it("should create line diff between two texts", () => {
         const text1 = "Line 1\nLine 2\nLine 3";
         const text2 = "Line 1\nModified Line 2\nLine 3";
         const result = createLineDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
         expect(result[0]).toHaveProperty("type");
         expect(result[0]).toHaveProperty("content");
      });

      it("should handle identical multiline texts", () => {
         const text1 = "Line 1\nLine 2\nLine 3";
         const text2 = "Line 1\nLine 2\nLine 3";
         const result = createLineDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         // Should return empty array for identical texts
         expect(result).toEqual([]);
      });

      it("should handle single line texts", () => {
         const text1 = "Single line";
         const text2 = "Single line modified";
         const result = createLineDiff(text1, text2);
         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
      });
   });
});

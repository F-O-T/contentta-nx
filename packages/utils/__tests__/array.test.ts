import { describe, it, expect } from "vitest";
import { shuffleArray } from "../src/array";

describe("array utilities", () => {
   describe("shuffleArray", () => {
      it("should shuffle array elements", () => {
         const array = [1, 2, 3, 4, 5];
         const result = shuffleArray(array);

         expect(result).toHaveLength(5);
         expect(result).toContain(1);
         expect(result).toContain(2);
         expect(result).toContain(3);
         expect(result).toContain(4);
         expect(result).toContain(5);
      });

      it("should not modify original array", () => {
         const array = [1, 2, 3, 4, 5];
         const originalArray = [...array];
         shuffleArray(array);
         expect(array).toEqual(originalArray);
      });

      it("should handle empty array", () => {
         const array: number[] = [];
         const result = shuffleArray(array);
         expect(result).toHaveLength(0);
         expect(result).toEqual([]);
      });

      it("should handle single element array", () => {
         const array = [42];
         const result = shuffleArray(array);
         expect(result).toHaveLength(1);
         expect(result[0]).toBe(42);
      });

      it("should handle array with duplicate elements", () => {
         const array = [1, 2, 2, 3, 3, 3];
         const result = shuffleArray(array);
         expect(result).toHaveLength(6);
         expect(result.filter((x) => x === 1)).toHaveLength(1);
         expect(result.filter((x) => x === 2)).toHaveLength(2);
         expect(result.filter((x) => x === 3)).toHaveLength(3);
      });

      it("should work with string arrays", () => {
         const array = ["a", "b", "c", "d"];
         const result = shuffleArray(array);
         expect(result).toHaveLength(4);
         expect(result).toContain("a");
         expect(result).toContain("b");
         expect(result).toContain("c");
         expect(result).toContain("d");
      });
   });
});

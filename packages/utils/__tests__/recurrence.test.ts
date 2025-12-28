import { describe, expect, it } from "bun:test";
import {
   generateFutureDates,
   getDefaultFutureOccurrences,
   getNextDueDate,
   getRecurrenceLabel,
   getRecurrencePatterns,
} from "../src/recurrence";

describe("recurrence utilities", () => {
   describe("getNextDueDate", () => {
      it("should calculate next monthly due date", () => {
         const currentDate = new Date("2024-01-15");
         const result = getNextDueDate(currentDate, "monthly");
         expect(result.getMonth()).toBe(1);
         expect(result.getDate()).toBe(15);
      });

      it("should calculate next quarterly due date", () => {
         const currentDate = new Date("2024-01-15");
         const result = getNextDueDate(currentDate, "quarterly");
         expect(result.getMonth()).toBe(3);
         expect(result.getDate()).toBe(15);
      });

      it("should calculate next semiannual due date", () => {
         const currentDate = new Date("2024-01-15");
         const result = getNextDueDate(currentDate, "semiannual");
         expect(result.getMonth()).toBe(6);
         expect(result.getDate()).toBe(15);
      });

      it("should calculate next annual due date", () => {
         const currentDate = new Date("2024-01-15");
         const result = getNextDueDate(currentDate, "annual");
         expect(result.getFullYear()).toBe(2025);
         expect(result.getMonth()).toBe(0);
         expect(result.getDate()).toBe(15);
      });

      it("should handle month overflow for monthly", () => {
         const currentDate = new Date("2024-12-15");
         const result = getNextDueDate(currentDate, "monthly");
         expect(result.getFullYear()).toBe(2025);
         expect(result.getMonth()).toBe(0);
      });

      it("should handle month overflow for quarterly", () => {
         const currentDate = new Date("2024-11-15");
         const result = getNextDueDate(currentDate, "quarterly");
         expect(result.getFullYear()).toBe(2025);
         expect(result.getMonth()).toBe(1);
      });

      it("should handle month overflow for semiannual", () => {
         const currentDate = new Date("2024-08-15");
         const result = getNextDueDate(currentDate, "semiannual");
         expect(result.getFullYear()).toBe(2025);
         expect(result.getMonth()).toBe(1);
      });

      it("should not modify original date", () => {
         const currentDate = new Date("2024-01-15");
         const originalTime = currentDate.getTime();
         getNextDueDate(currentDate, "monthly");
         expect(currentDate.getTime()).toBe(originalTime);
      });
   });

   describe("getRecurrenceLabel", () => {
      it("should return label for monthly", () => {
         const result = getRecurrenceLabel("monthly");
         expect(result).toBe("Mensal");
      });

      it("should return label for quarterly", () => {
         const result = getRecurrenceLabel("quarterly");
         expect(result).toBe("Trimestral");
      });

      it("should return label for semiannual", () => {
         const result = getRecurrenceLabel("semiannual");
         expect(result).toBe("Semestral");
      });

      it("should return label for annual", () => {
         const result = getRecurrenceLabel("annual");
         expect(result).toBe("Anual");
      });
   });

   describe("getRecurrencePatterns", () => {
      it("should return all patterns", () => {
         const result = getRecurrencePatterns();
         expect(result).toContain("monthly");
         expect(result).toContain("quarterly");
         expect(result).toContain("semiannual");
         expect(result).toContain("annual");
         expect(result.length).toBe(4);
      });

      it("should return patterns in correct order", () => {
         const result = getRecurrencePatterns();
         expect(result).toEqual([
            "monthly",
            "quarterly",
            "semiannual",
            "annual",
         ]);
      });
   });

   describe("getDefaultFutureOccurrences", () => {
      it("should return 12 for monthly", () => {
         const result = getDefaultFutureOccurrences("monthly");
         expect(result).toBe(12);
      });

      it("should return 8 for quarterly", () => {
         const result = getDefaultFutureOccurrences("quarterly");
         expect(result).toBe(8);
      });

      it("should return 6 for semiannual", () => {
         const result = getDefaultFutureOccurrences("semiannual");
         expect(result).toBe(6);
      });

      it("should return 5 for annual", () => {
         const result = getDefaultFutureOccurrences("annual");
         expect(result).toBe(5);
      });
   });

   describe("generateFutureDates", () => {
      it("should generate future dates for monthly pattern", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "monthly", 3);
         expect(result.length).toBe(3);
         expect(result[0]?.getMonth()).toBe(1);
         expect(result[1]?.getMonth()).toBe(2);
         expect(result[2]?.getMonth()).toBe(3);
      });

      it("should generate future dates for quarterly pattern", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "quarterly", 2);
         expect(result.length).toBe(2);
         expect(result[0]?.getMonth()).toBe(3);
         expect(result[1]?.getMonth()).toBe(6);
      });

      it("should generate future dates for semiannual pattern", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "semiannual", 2);
         expect(result.length).toBe(2);
         expect(result[0]?.getMonth()).toBe(6);
         expect(result[1]?.getFullYear()).toBe(2025);
      });

      it("should generate future dates for annual pattern", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "annual", 3);
         expect(result.length).toBe(3);
         expect(result[0]?.getFullYear()).toBe(2025);
         expect(result[1]?.getFullYear()).toBe(2026);
         expect(result[2]?.getFullYear()).toBe(2027);
      });

      it("should use default occurrences when count not provided", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "monthly");
         expect(result.length).toBe(12);
      });

      it("should use default occurrences for quarterly", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "quarterly");
         expect(result.length).toBe(8);
      });

      it("should use default occurrences for semiannual", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "semiannual");
         expect(result.length).toBe(6);
      });

      it("should use default occurrences for annual", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "annual");
         expect(result.length).toBe(5);
      });

      it("should not modify original base date", () => {
         const baseDate = new Date("2024-01-15");
         const originalTime = baseDate.getTime();
         generateFutureDates(baseDate, "monthly", 5);
         expect(baseDate.getTime()).toBe(originalTime);
      });

      it("should return independent date objects", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "monthly", 3);
         const first = result[0];
         const second = result[1];
         if (first && second) {
            first.setMonth(10);
            expect(second.getMonth()).not.toBe(10);
         }
      });

      it("should handle zero count", () => {
         const baseDate = new Date("2024-01-15");
         const result = generateFutureDates(baseDate, "monthly", 0);
         expect(result.length).toBe(0);
      });
   });
});

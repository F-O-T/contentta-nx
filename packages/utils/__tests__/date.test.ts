import { describe, it, expect } from "vitest";
import { getCurrentDate, formatDate } from "../src/date";

describe("date utilities", () => {
   describe("getCurrentDate", () => {
      it("should return current date object", () => {
         const result = getCurrentDate();
         expect(result).toHaveProperty("date");
         expect(typeof result.date).toBe("string");
      });

      it("should accept timezone parameter", () => {
         const result = getCurrentDate("UTC");
         expect(result).toHaveProperty("date");
         expect(typeof result.date).toBe("string");
      });
   });

   describe("formatDate", () => {
      it("should format date as string", () => {
         const date = new Date("2024-01-15T12:00:00Z");
         const result = formatDate(date);
         expect(typeof result).toBe("string");
      });

      it("should accept timezone parameter", () => {
         const date = new Date("2024-01-15T12:00:00Z");
         const result = formatDate(date, "UTC");
         expect(typeof result).toBe("string");
      });

      it("should handle different dates", () => {
         const date1 = new Date("2024-01-15T12:00:00Z");
         const date2 = new Date("2024-02-20T15:30:00Z");
         const result1 = formatDate(date1);
         const result2 = formatDate(date2);
         expect(typeof result1).toBe("string");
         expect(typeof result2).toBe("string");
      });
   });
});

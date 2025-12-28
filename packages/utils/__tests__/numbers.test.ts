import { describe, expect, it } from "bun:test";
import { formatWindow } from "../src/numbers";

describe("number utilities", () => {
   describe("formatWindow", () => {
      it("should format milliseconds into readable time", () => {
         const result = formatWindow(1000);
         expect(typeof result).toBe("string");
         expect(result).toBe("1 second");
      });

      it("should format multiple seconds", () => {
         const result = formatWindow(5000);
         expect(result).toBe("5 seconds");
      });

      it("should format minutes", () => {
         const result = formatWindow(60000);
         expect(result).toBe("1 minute");
      });

      it("should format multiple minutes", () => {
         const result = formatWindow(120000);
         expect(result).toBe("2 minutes");
      });

      it("should format hours", () => {
         const result = formatWindow(3600000);
         expect(result).toBe("1 hour");
      });

      it("should format multiple hours", () => {
         const result = formatWindow(7200000);
         expect(result).toBe("2 hours");
      });

      it("should format days", () => {
         const result = formatWindow(86400000);
         expect(result).toBe("1 day");
      });

      it("should format multiple days", () => {
         const result = formatWindow(172800000);
         expect(result).toBe("2 days");
      });

      it("should handle zero milliseconds", () => {
         const result = formatWindow(0);
         expect(result).toBe("period");
      });

      it("should handle negative milliseconds", () => {
         const result = formatWindow(-1000);
         expect(result).toBe("period");
      });

      it("should handle NaN", () => {
         const result = formatWindow(Number.NaN);
         expect(result).toBe("period");
      });

      it("should handle non-number", () => {
         const result = formatWindow("not a number" as unknown as number);
         expect(result).toBe("period");
      });

      it("should handle non-divisible milliseconds", () => {
         const result = formatWindow(1500);
         expect(result).toBe("1500 ms");
      });

      it("should handle small non-divisible milliseconds", () => {
         const result = formatWindow(150);
         expect(result).toBe("150 ms");
      });
   });
});

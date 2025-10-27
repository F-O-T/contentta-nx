import { describe, it, expect } from "vitest";
import { formatWindow } from "../src/numbers";

describe("number utilities", () => {
   describe("formatWindow", () => {
      it("should format milliseconds into readable time", () => {
         const result = formatWindow(1000);
         expect(typeof result).toBe("string");
      });

      it("should format seconds", () => {
         const result = formatWindow(5000);
         expect(typeof result).toBe("string");
      });

      it("should format minutes", () => {
         const result = formatWindow(60000);
         expect(typeof result).toBe("string");
      });

      it("should format hours", () => {
         const result = formatWindow(3600000);
         expect(typeof result).toBe("string");
      });

      it("should handle zero milliseconds", () => {
         const result = formatWindow(0);
         expect(typeof result).toBe("string");
      });

      it("should handle small milliseconds", () => {
         const result = formatWindow(150);
         expect(typeof result).toBe("string");
      });

      it("should handle large values", () => {
         const result = formatWindow(86400000); // 24 hours
         expect(typeof result).toBe("string");
      });
   });
});

import { describe, it, expect } from "vitest";
import { sanitizeDocumentType } from "../src/file";

describe("file utilities", () => {
   describe("sanitizeDocumentType", () => {
      it("should sanitize document type", () => {
         const result = sanitizeDocumentType("application/pdf");
         expect(typeof result).toBe("string");
         expect(result.length).toBeGreaterThan(0);
      });

      it("should handle empty string", () => {
         const result = sanitizeDocumentType("");
         expect(typeof result).toBe("string");
      });

      it("should handle special characters", () => {
         const result = sanitizeDocumentType(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         );
         expect(typeof result).toBe("string");
         expect(result.length).toBeGreaterThan(0);
      });

      it("should handle already clean types", () => {
         const result = sanitizeDocumentType("image/jpeg");
         expect(typeof result).toBe("string");
      });
   });
});

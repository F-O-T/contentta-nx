import { describe, expect, it } from "bun:test";
import { gunzipSync } from "fflate";
import { compressMarkdown } from "../src/text-file-helpers";

describe("text file helpers", () => {
   describe("compressMarkdown", () => {
      it("should compress a simple markdown buffer", () => {
         const markdown = "# Hello World\n\nThis is a test.";
         const inputBuffer = Buffer.from(markdown);

         const result = compressMarkdown(inputBuffer);

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should produce valid gzip output that can be decompressed", () => {
         const markdown = "# Hello World\n\nThis is a test.";
         const inputBuffer = Buffer.from(markdown);

         const compressed = compressMarkdown(inputBuffer);
         const decompressed = Buffer.from(gunzipSync(compressed));

         expect(decompressed.toString()).toBe(markdown);
      });

      it("should compress large markdown content", () => {
         const largeMd = "# Title\n\n".repeat(1000) + "Content ".repeat(5000);
         const inputBuffer = Buffer.from(largeMd);

         const result = compressMarkdown(inputBuffer);

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeLessThan(inputBuffer.length);
      });

      it("should handle empty buffer", () => {
         const emptyBuffer = Buffer.from("");

         const result = compressMarkdown(emptyBuffer);

         expect(result).toBeInstanceOf(Buffer);
         const decompressed = Buffer.from(gunzipSync(result));
         expect(decompressed.toString()).toBe("");
      });

      it("should handle markdown with special characters", () => {
         const markdown =
            "# Título em Português\n\n- Item com acentuação: café, maçã\n- Emoji: 🎉\n- Symbols: ©®™";
         const inputBuffer = Buffer.from(markdown);

         const compressed = compressMarkdown(inputBuffer);
         const decompressed = Buffer.from(gunzipSync(compressed));

         expect(decompressed.toString()).toBe(markdown);
      });

      it("should handle markdown with code blocks", () => {
         const markdown =
            "# Code Example\n\n```typescript\nconst x: number = 42;\nconsole.log(x);\n```\n\nEnd of document.";
         const inputBuffer = Buffer.from(markdown);

         const compressed = compressMarkdown(inputBuffer);
         const decompressed = Buffer.from(gunzipSync(compressed));

         expect(decompressed.toString()).toBe(markdown);
      });

      it("should handle binary-like content in buffer", () => {
         const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);

         const compressed = compressMarkdown(binaryContent);
         const decompressed = Buffer.from(gunzipSync(compressed));

         expect(decompressed).toEqual(binaryContent);
      });

      it("should produce consistent output for same input", () => {
         const markdown = "# Consistent Test\n\nSame content.";
         const inputBuffer = Buffer.from(markdown);

         const result1 = compressMarkdown(inputBuffer);
         const result2 = compressMarkdown(inputBuffer);

         expect(result1).toEqual(result2);
      });
   });
});

import { describe, it, expect } from "vitest";
import { propagateError, validateInput, AppError } from "../src/errors";
import { z } from "zod";

describe("error utilities", () => {
   describe("propagateError", () => {
      it("should handle AppError objects", () => {
         const error = new AppError("Test error");
         expect(() => propagateError(error)).toThrow("Test error");
      });

      it("should not throw for regular Error objects", () => {
         const error = new Error("Test error");
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should not throw for string errors", () => {
         const error = "String error";
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should not throw for unknown objects", () => {
         const error = { message: "Object error" };
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should handle null/undefined errors", () => {
         expect(() => propagateError(null)).not.toThrow();
         expect(() => propagateError(undefined)).not.toThrow();
      });
   });

   describe("validateInput", () => {
      it("should validate input against schema", () => {
         const schema = z.object({
            name: z.string(),
            age: z.number(),
         });

         const validInput = { name: "John", age: 30 };
         const result = validateInput(schema, validInput);
         expect(result).toEqual(validInput);
      });

      it("should throw for invalid input", () => {
         const schema = z.object({
            name: z.string(),
            age: z.number(),
         });

         const invalidInput = { name: "John", age: "not-a-number" };
         expect(() => validateInput(schema, invalidInput)).toThrow();
      });

      it("should handle partial validation", () => {
         const schema = z.object({
            name: z.string(),
            age: z.number().optional(),
         });

         const partialInput = { name: "John" };
         const result = validateInput(schema, partialInput);
         expect(result).toEqual({ name: "John" });
      });
   });
});

import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { getDomain, isProduction, parseEnv } from "../src/helpers";

describe("environment helpers", () => {
   describe("parseEnv", () => {
      it("should parse valid environment variables", () => {
         const schema = z.object({
            API_KEY: z.string(),
            PORT: z.string(),
         });

         const env = {
            API_KEY: "test-key",
            PORT: "3000",
         };

         const result = parseEnv(env as NodeJS.ProcessEnv, schema);

         expect(result).toEqual({
            API_KEY: "test-key",
            PORT: "3000",
         });
      });

      it("should apply default values from schema", () => {
         const schema = z.object({
            API_KEY: z.string(),
            PORT: z.string().default("8080"),
         });

         const env = {
            API_KEY: "test-key",
         };

         const result = parseEnv(env as NodeJS.ProcessEnv, schema);

         expect(result).toEqual({
            API_KEY: "test-key",
            PORT: "8080",
         });
      });

      it("should throw AppError for missing required variables", () => {
         const schema = z.object({
            REQUIRED_VAR: z.string(),
         });

         const env = {};

         expect(() => parseEnv(env as NodeJS.ProcessEnv, schema)).toThrow();
      });

      it("should throw AppError with validation details for invalid types", () => {
         const schema = z.object({
            NUMBER_VAR: z.coerce.number(),
         });

         const env = {
            NUMBER_VAR: "not-a-number",
         };

         expect(() => parseEnv(env as NodeJS.ProcessEnv, schema)).toThrow();
      });

      it("should handle optional environment variables", () => {
         const schema = z.object({
            OPTIONAL: z.string().optional(),
            REQUIRED: z.string(),
         });

         const env = {
            REQUIRED: "required-value",
         };

         const result = parseEnv(env as NodeJS.ProcessEnv, schema);

         expect(result).toEqual({
            OPTIONAL: undefined,
            REQUIRED: "required-value",
         });
      });

      it("should handle complex schemas with transformations", () => {
         const schema = z.object({
            ENABLED: z
               .string()
               .transform((val) => val === "true")
               .pipe(z.boolean()),
            ITEMS: z
               .string()
               .transform((val) => val.split(","))
               .pipe(z.array(z.string())),
         });

         const env = {
            ENABLED: "true",
            ITEMS: "item1,item2,item3",
         };

         const result = parseEnv(env as NodeJS.ProcessEnv, schema);

         expect(result).toEqual({
            ENABLED: true,
            ITEMS: ["item1", "item2", "item3"],
         });
      });

      it("should handle empty string values", () => {
         const schema = z.object({
            EMPTY_ALLOWED: z.string(),
            NON_EMPTY: z.string().min(1),
         });

         const env = {
            EMPTY_ALLOWED: "",
            NON_EMPTY: "",
         };

         expect(() => parseEnv(env as NodeJS.ProcessEnv, schema)).toThrow();
      });

      it("should handle URL validation", () => {
         const schema = z.object({
            API_URL: z.string().url(),
         });

         const validEnv = {
            API_URL: "https://api.example.com",
         };

         const result = parseEnv(validEnv as NodeJS.ProcessEnv, schema);
         expect(result.API_URL).toBe("https://api.example.com");

         const invalidEnv = {
            API_URL: "not-a-url",
         };

         expect(() =>
            parseEnv(invalidEnv as NodeJS.ProcessEnv, schema),
         ).toThrow();
      });
   });

   describe("isProduction", () => {
      it("should be a boolean value", () => {
         expect(typeof isProduction).toBe("boolean");
      });
   });

   describe("getDomain", () => {
      it("should return a valid URL string", () => {
         const domain = getDomain();
         expect(typeof domain).toBe("string");
         expect(domain.startsWith("http")).toBe(true);
      });

      it("should return localhost URL in development", () => {
         if (!isProduction) {
            const domain = getDomain();
            expect(domain).toBe("http://localhost:3000");
         }
      });

      it("should return production URL in production", () => {
         if (isProduction) {
            const domain = getDomain();
            expect(domain).toBe("https://app.montte.co");
         }
      });
   });
});

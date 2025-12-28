import { describe, expect, it } from "bun:test";
import { sanitizeData } from "../src/sanitization";

describe("sanitization utilities", () => {
   describe("sanitizeData", () => {
      it("should mask password fields", () => {
         const data = { password: "secret123", username: "john" };
         const result = sanitizeData(data);
         expect(result.password).toBe("********");
         expect(result.username).toBe("john");
      });

      it("should mask confirmpassword fields", () => {
         const data = { confirmpassword: "secret123" };
         const result = sanitizeData(data);
         expect(result.confirmpassword).toBe("********");
      });

      it("should mask token fields", () => {
         const data = { token: "abc123xyz" };
         const result = sanitizeData(data);
         expect(result.token).toBe("********");
      });

      it("should mask accesstoken fields", () => {
         const data = { accesstoken: "token123" };
         const result = sanitizeData(data);
         expect(result.accesstoken).toBe("********");
      });

      it("should mask refreshtoken fields", () => {
         const data = { refreshtoken: "refresh123" };
         const result = sanitizeData(data);
         expect(result.refreshtoken).toBe("********");
      });

      it("should mask apiKey fields", () => {
         const data = { apiKey: "key123" };
         const result = sanitizeData(data);
         expect(result.apiKey).toBe("********");
      });

      it("should mask api_key fields", () => {
         const data = { api_key: "key123" };
         const result = sanitizeData(data);
         expect(result.api_key).toBe("********");
      });

      it("should mask secret fields", () => {
         const data = { secret: "mysecret" };
         const result = sanitizeData(data);
         expect(result.secret).toBe("********");
      });

      it("should mask auth fields", () => {
         const data = { auth: "authvalue" };
         const result = sanitizeData(data);
         expect(result.auth).toBe("********");
      });

      it("should mask authorization fields", () => {
         const data = { authorization: "Bearer token" };
         const result = sanitizeData(data);
         expect(result.authorization).toBe("********");
      });

      it("should mask ssn fields", () => {
         const data = { ssn: "123-45-6789" };
         const result = sanitizeData(data);
         expect(result.ssn).toBe("********");
      });

      it("should mask email key fields", () => {
         const data = { email: "test@example.com" };
         const result = sanitizeData(data);
         expect(result.email).toBe("********");
      });

      it("should mask phone key fields", () => {
         const data = { phone: "555-1234" };
         const result = sanitizeData(data);
         expect(result.phone).toBe("********");
      });

      it("should mask keys containing sensitive substrings", () => {
         const data = { myApiToken: "token123", userPassword: "secret" };
         const result = sanitizeData(data);
         expect(result.userPassword).toBe("********");
         expect(result.myApiToken).toBe("********");
      });

      it("should mask email-like string values", () => {
         const data = { contact: "user@example.com" };
         const result = sanitizeData(data);
         expect(result.contact).toBe("********");
      });

      it("should mask phone-like string values", () => {
         const data = { number: "+1 (555) 123-4567" };
         const result = sanitizeData(data);
         expect(result.number).toBe("********");
      });

      it("should mask long alphanumeric strings (likely secrets)", () => {
         const data = { value: "abcdefghij1234567890ABCD" };
         const result = sanitizeData(data);
         expect(result.value).toBe("********");
      });

      it("should not mask regular strings", () => {
         const data = { name: "John Doe" };
         const result = sanitizeData(data);
         expect(result.name).toBe("John Doe");
      });

      it("should not mask short strings", () => {
         const data = { code: "ABC" };
         const result = sanitizeData(data);
         expect(result.code).toBe("ABC");
      });

      it("should handle nested objects", () => {
         const data = {
            credentials: {
               password: "secret",
               username: "john",
            },
            name: "Test",
         };
         const result = sanitizeData(data);
         expect(result.name).toBe("Test");
         const credentials = result.credentials as {
            username: string;
            password: string;
         };
         expect(credentials.password).toBe("********");
         expect(credentials.username).toBe("john");
      });

      it("should handle arrays", () => {
         const data = [
            { password: "secret1", user: "john" },
            { password: "secret2", user: "jane" },
         ];
         const result = sanitizeData(data);
         const first = result[0] as { password: string; user: string };
         const second = result[1] as { password: string; user: string };
         expect(first.password).toBe("********");
         expect(first.user).toBe("john");
         expect(second.password).toBe("********");
         expect(second.user).toBe("jane");
      });

      it("should handle null values in sensitive keys", () => {
         const data = { password: null as unknown as string, user: "john" };
         const result = sanitizeData(data);
         expect(result.password).toBe("********");
         expect(result.user).toBe("john");
      });

      it("should handle undefined values in sensitive keys", () => {
         const data = {
            password: undefined as unknown as string,
            user: "john",
         };
         const result = sanitizeData(data);
         expect(result.password).toBe("********");
         expect(result.user).toBe("john");
      });

      it("should return primitive values as-is", () => {
         expect(sanitizeData("string")).toBe("string");
         expect(sanitizeData(123)).toBe(123);
         expect(sanitizeData(true)).toBe(true);
         expect(sanitizeData(null)).toBe(null);
         expect(sanitizeData(undefined)).toBe(undefined);
      });

      it("should handle empty object", () => {
         const data = {};
         const result = sanitizeData(data);
         expect(result).toEqual({});
      });

      it("should handle empty array", () => {
         const data: unknown[] = [];
         const result = sanitizeData(data);
         expect(result).toEqual([]);
      });

      it("should preserve numbers", () => {
         const data = { age: 25, password: "secret" };
         const result = sanitizeData(data);
         expect(result.age).toBe(25);
         expect(result.password).toBe("********");
      });

      it("should preserve booleans", () => {
         const data = { active: true, password: "secret" };
         const result = sanitizeData(data);
         expect(result.active).toBe(true);
         expect(result.password).toBe("********");
      });

      it("should handle deeply nested structures", () => {
         const data = {
            level1: {
               level2: {
                  level3: {
                     password: "deep-secret",
                  },
               },
            },
         };
         const result = sanitizeData(data);
         const level1 = result.level1 as {
            level2: { level3: { password: string } };
         };
         expect(level1.level2.level3.password).toBe("********");
      });

      it("should handle arrays within objects", () => {
         const data = {
            users: [{ password: "pass1" }, { password: "pass2" }],
         };
         const result = sanitizeData(data);
         const users = result.users as Array<{ password: string }>;
         expect(users[0]?.password).toBe("********");
         expect(users[1]?.password).toBe("********");
      });

      it("should not modify original data", () => {
         const data = { password: "secret", user: "john" };
         const original = { ...data };
         sanitizeData(data);
         expect(data).toEqual(original);
      });

      it("should handle mixed case sensitive keys", () => {
         const data = { PASSWORD: "secret", Password: "secret2" };
         const result = sanitizeData(data);
         expect(result.PASSWORD).toBe("********");
         expect(result.Password).toBe("********");
      });
   });
});

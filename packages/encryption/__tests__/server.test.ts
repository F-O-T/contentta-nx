import { describe, expect, it } from "bun:test";
import {
	decryptField,
	decryptIfNeeded,
	encryptField,
	encryptIfNeeded,
	generateEncryptionKey,
	isEncrypted,
	type EncryptedData,
} from "../src/server";

// Valid 64-character hex key (32 bytes)
const TEST_KEY =
	"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("server encryption", () => {
	describe("generateEncryptionKey", () => {
		it("should generate a 64-character hex string", () => {
			const key = generateEncryptionKey();

			expect(key).toHaveLength(64);
			expect(/^[0-9a-f]+$/.test(key)).toBe(true);
		});

		it("should generate unique keys", () => {
			const key1 = generateEncryptionKey();
			const key2 = generateEncryptionKey();

			expect(key1).not.toBe(key2);
		});
	});

	describe("encryptField", () => {
		it("should encrypt a plaintext value", () => {
			const plaintext = "sensitive data";
			const encrypted = encryptField(plaintext, TEST_KEY);

			expect(encrypted).toHaveProperty("ciphertext");
			expect(encrypted).toHaveProperty("iv");
			expect(encrypted).toHaveProperty("authTag");
			expect(encrypted).toHaveProperty("version", 1);
		});

		it("should produce different ciphertexts for the same plaintext (random IV)", () => {
			const plaintext = "same value";
			const encrypted1 = encryptField(plaintext, TEST_KEY);
			const encrypted2 = encryptField(plaintext, TEST_KEY);

			expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
			expect(encrypted1.iv).not.toBe(encrypted2.iv);
		});

		it("should throw error for empty value", () => {
			expect(() => encryptField("", TEST_KEY)).toThrow(
				"Cannot encrypt empty value",
			);
		});

		it("should throw error for invalid key format", () => {
			expect(() => encryptField("test", "invalid")).toThrow(
				"ENCRYPTION_KEY must be a 64-character hex string",
			);
		});

		it("should throw error for key with wrong length", () => {
			expect(() => encryptField("test", "0123456789abcdef")).toThrow(
				"ENCRYPTION_KEY must be a 64-character hex string",
			);
		});

		it("should throw error for key with non-hex characters", () => {
			const invalidKey = "zzzz" + TEST_KEY.slice(4);
			expect(() => encryptField("test", invalidKey)).toThrow(
				"ENCRYPTION_KEY must be a 64-character hex string",
			);
		});

		it("should handle unicode characters", () => {
			const plaintext = "Hello, 世界! 🔐";
			const encrypted = encryptField(plaintext, TEST_KEY);
			const decrypted = decryptField(encrypted, TEST_KEY);

			expect(decrypted).toBe(plaintext);
		});

		it("should handle very long strings", () => {
			const plaintext = "a".repeat(10000);
			const encrypted = encryptField(plaintext, TEST_KEY);
			const decrypted = decryptField(encrypted, TEST_KEY);

			expect(decrypted).toBe(plaintext);
		});

		it("should handle special characters", () => {
			const plaintext = 'Special: <>&"\'\\/\n\t\r';
			const encrypted = encryptField(plaintext, TEST_KEY);
			const decrypted = decryptField(encrypted, TEST_KEY);

			expect(decrypted).toBe(plaintext);
		});
	});

	describe("decryptField", () => {
		it("should decrypt an encrypted value correctly", () => {
			const plaintext = "sensitive data";
			const encrypted = encryptField(plaintext, TEST_KEY);
			const decrypted = decryptField(encrypted, TEST_KEY);

			expect(decrypted).toBe(plaintext);
		});

		it("should throw error for invalid encrypted data", () => {
			expect(() =>
				decryptField(null as unknown as EncryptedData, TEST_KEY),
			).toThrow("Invalid encrypted data");

			expect(() =>
				decryptField({} as unknown as EncryptedData, TEST_KEY),
			).toThrow("Invalid encrypted data");

			expect(() =>
				decryptField(
					{ ciphertext: "", iv: "", authTag: "", version: 1 },
					TEST_KEY,
				),
			).toThrow("Invalid encrypted data");
		});

		it("should throw error when using wrong key", () => {
			const plaintext = "sensitive data";
			const encrypted = encryptField(plaintext, TEST_KEY);
			const wrongKey =
				"fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

			expect(() => decryptField(encrypted, wrongKey)).toThrow();
		});

		it("should throw error when ciphertext is tampered", () => {
			const encrypted = encryptField("test", TEST_KEY);
			const tamperedCiphertext = Buffer.from(
				Buffer.from(encrypted.ciphertext, "base64")
					.map((b) => b ^ 0xff)
					.buffer,
			).toString("base64");

			expect(() =>
				decryptField({ ...encrypted, ciphertext: tamperedCiphertext }, TEST_KEY),
			).toThrow();
		});

		it("should throw error when auth tag is tampered", () => {
			const encrypted = encryptField("test", TEST_KEY);
			const tamperedAuthTag = Buffer.from(
				Buffer.from(encrypted.authTag, "base64")
					.map((b) => b ^ 0xff)
					.buffer,
			).toString("base64");

			expect(() =>
				decryptField({ ...encrypted, authTag: tamperedAuthTag }, TEST_KEY),
			).toThrow();
		});

		it("should throw error when IV is tampered", () => {
			const encrypted = encryptField("test", TEST_KEY);
			const tamperedIv = Buffer.from(
				Buffer.from(encrypted.iv, "base64")
					.map((b) => b ^ 0xff)
					.buffer,
			).toString("base64");

			expect(() =>
				decryptField({ ...encrypted, iv: tamperedIv }, TEST_KEY),
			).toThrow();
		});
	});

	describe("isEncrypted", () => {
		it("should return true for valid EncryptedData", () => {
			const encrypted = encryptField("test", TEST_KEY);
			expect(isEncrypted(encrypted)).toBe(true);
		});

		it("should return false for null", () => {
			expect(isEncrypted(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			expect(isEncrypted(undefined)).toBe(false);
		});

		it("should return false for strings", () => {
			expect(isEncrypted("plain text")).toBe(false);
		});

		it("should return false for numbers", () => {
			expect(isEncrypted(123)).toBe(false);
		});

		it("should return false for incomplete objects", () => {
			expect(isEncrypted({ ciphertext: "abc" })).toBe(false);
			expect(isEncrypted({ ciphertext: "abc", iv: "def" })).toBe(false);
			expect(
				isEncrypted({ ciphertext: "abc", iv: "def", authTag: "ghi" }),
			).toBe(false);
		});

		it("should return false for objects with wrong types", () => {
			expect(
				isEncrypted({ ciphertext: 123, iv: "def", authTag: "ghi", version: 1 }),
			).toBe(false);
			expect(
				isEncrypted({
					ciphertext: "abc",
					iv: "def",
					authTag: "ghi",
					version: "1",
				}),
			).toBe(false);
		});
	});

	describe("encryptIfNeeded", () => {
		it("should encrypt a plain string", () => {
			const result = encryptIfNeeded("plain text", TEST_KEY);

			expect(isEncrypted(result)).toBe(true);
		});

		it("should return already encrypted data unchanged", () => {
			const encrypted = encryptField("test", TEST_KEY);
			const result = encryptIfNeeded(encrypted, TEST_KEY);

			expect(result).toBe(encrypted);
			expect(result.ciphertext).toBe(encrypted.ciphertext);
		});
	});

	describe("decryptIfNeeded", () => {
		it("should decrypt encrypted data", () => {
			const encrypted = encryptField("secret", TEST_KEY);
			const result = decryptIfNeeded(encrypted, TEST_KEY);

			expect(result).toBe("secret");
		});

		it("should return plain string unchanged", () => {
			const result = decryptIfNeeded("plain text", TEST_KEY);

			expect(result).toBe("plain text");
		});
	});

	describe("encryption roundtrip", () => {
		it("should preserve data through encrypt/decrypt cycle", () => {
			const testCases = [
				"simple text",
				"with spaces and punctuation!",
				"unicode: 日本語 한국어 العربية",
				"emoji: 🔐🔑💾",
				'{"json": "data", "number": 123}',
				"   whitespace preserved   ",
				"\n\t\rnewlines and tabs",
			];

			for (const plaintext of testCases) {
				const encrypted = encryptField(plaintext, TEST_KEY);
				const decrypted = decryptField(encrypted, TEST_KEY);
				expect(decrypted).toBe(plaintext);
			}
		});

		it("should work with dynamically generated keys", () => {
			const dynamicKey = generateEncryptionKey();
			const plaintext = "test with dynamic key";

			const encrypted = encryptField(plaintext, dynamicKey);
			const decrypted = decryptField(encrypted, dynamicKey);

			expect(decrypted).toBe(plaintext);
		});
	});
});

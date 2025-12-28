import { describe, expect, it } from "bun:test";
import nacl from "tweetnacl";
import {
	decryptE2E,
	deriveKey,
	encryptE2E,
	generateRecoveryCode,
	generateSalt,
	hashKey,
	isE2EEncrypted,
	keyToString,
	stringToKey,
	type E2EEncryptedData,
} from "../src/client";

describe("client E2E encryption", () => {
	describe("generateSalt", () => {
		it("should generate a base64 encoded salt", () => {
			const salt = generateSalt();

			expect(typeof salt).toBe("string");
			// Base64 of 16 bytes should be ~24 characters (with padding)
			expect(salt.length).toBeGreaterThanOrEqual(20);
		});

		it("should generate unique salts", () => {
			const salt1 = generateSalt();
			const salt2 = generateSalt();

			expect(salt1).not.toBe(salt2);
		});
	});

	describe("deriveKey", () => {
		it("should derive a 32-byte key from passphrase", async () => {
			const passphrase = "my-secure-passphrase";
			const salt = generateSalt();
			const key = await deriveKey(passphrase, salt);

			expect(key).toBeInstanceOf(Uint8Array);
			expect(key.length).toBe(nacl.secretbox.keyLength);
		});

		it("should produce the same key for same passphrase and salt", async () => {
			const passphrase = "deterministic-test";
			const salt = generateSalt();

			const key1 = await deriveKey(passphrase, salt);
			const key2 = await deriveKey(passphrase, salt);

			expect(key1).toEqual(key2);
		});

		it("should produce different keys for different passphrases", async () => {
			const salt = generateSalt();

			const key1 = await deriveKey("passphrase-one", salt);
			const key2 = await deriveKey("passphrase-two", salt);

			expect(key1).not.toEqual(key2);
		});

		it("should produce different keys for different salts", async () => {
			const passphrase = "same-passphrase";

			const key1 = await deriveKey(passphrase, generateSalt());
			const key2 = await deriveKey(passphrase, generateSalt());

			expect(key1).not.toEqual(key2);
		});

		it("should throw error for empty passphrase", async () => {
			const salt = generateSalt();

			await expect(deriveKey("", salt)).rejects.toThrow(
				"Passphrase must be at least 8 characters",
			);
		});

		it("should throw error for short passphrase", async () => {
			const salt = generateSalt();

			await expect(deriveKey("short", salt)).rejects.toThrow(
				"Passphrase must be at least 8 characters",
			);
			await expect(deriveKey("1234567", salt)).rejects.toThrow(
				"Passphrase must be at least 8 characters",
			);
		});

		it("should accept passphrase with exactly 8 characters", async () => {
			const salt = generateSalt();
			const key = await deriveKey("12345678", salt);

			expect(key.length).toBe(nacl.secretbox.keyLength);
		});
	});

	describe("encryptE2E", () => {
		it("should encrypt a plaintext value", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const plaintext = "sensitive data";

			const encrypted = encryptE2E(plaintext, key);

			expect(encrypted).toHaveProperty("encrypted");
			expect(encrypted).toHaveProperty("nonce");
			expect(encrypted).toHaveProperty("version", 1);
		});

		it("should produce different nonces for each encryption", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const plaintext = "same value";

			const encrypted1 = encryptE2E(plaintext, key);
			const encrypted2 = encryptE2E(plaintext, key);

			expect(encrypted1.nonce).not.toBe(encrypted2.nonce);
			expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
		});

		it("should throw error for empty value", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);

			expect(() => encryptE2E("", key)).toThrow("Cannot encrypt empty value");
		});

		it("should throw error for invalid key length", () => {
			const shortKey = new Uint8Array(16);
			const longKey = new Uint8Array(64);

			expect(() => encryptE2E("test", shortKey)).toThrow(
				"Key must be 32 bytes",
			);
			expect(() => encryptE2E("test", longKey)).toThrow("Key must be 32 bytes");
		});

		it("should handle unicode characters", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const plaintext = "Hello, 世界! 🔐";

			const encrypted = encryptE2E(plaintext, key);
			const decrypted = decryptE2E(encrypted, key);

			expect(decrypted).toBe(plaintext);
		});

		it("should handle very long strings", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const plaintext = "a".repeat(10000);

			const encrypted = encryptE2E(plaintext, key);
			const decrypted = decryptE2E(encrypted, key);

			expect(decrypted).toBe(plaintext);
		});
	});

	describe("decryptE2E", () => {
		it("should decrypt an encrypted value correctly", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const plaintext = "sensitive data";

			const encrypted = encryptE2E(plaintext, key);
			const decrypted = decryptE2E(encrypted, key);

			expect(decrypted).toBe(plaintext);
		});

		it("should throw error for invalid encrypted data", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);

			expect(() =>
				decryptE2E(null as unknown as E2EEncryptedData, key),
			).toThrow("Invalid encrypted data");

			expect(() =>
				decryptE2E({} as unknown as E2EEncryptedData, key),
			).toThrow("Invalid encrypted data");

			expect(() =>
				decryptE2E({ encrypted: "", nonce: "", version: 1 }, key),
			).toThrow();
		});

		it("should throw error when using wrong key", async () => {
			const salt = generateSalt();
			const key1 = await deriveKey("passphrase-one", salt);
			const key2 = await deriveKey("passphrase-two", salt);

			const encrypted = encryptE2E("test", key1);

			expect(() => decryptE2E(encrypted, key2)).toThrow(
				"Decryption failed - invalid key or corrupted data",
			);
		});

		it("should throw error for invalid key length", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const encrypted = encryptE2E("test", key);

			const shortKey = new Uint8Array(16);

			expect(() => decryptE2E(encrypted, shortKey)).toThrow(
				"Key must be 32 bytes",
			);
		});

		it("should throw error when encrypted data is tampered", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const encrypted = encryptE2E("test", key);

			// Tamper with the encrypted data by modifying a character
			const tamperedData = {
				...encrypted,
				encrypted: encrypted.encrypted.slice(0, -4) + "XXXX",
			};

			expect(() => decryptE2E(tamperedData, key)).toThrow(
				"Decryption failed - invalid key or corrupted data",
			);
		});
	});

	describe("hashKey", () => {
		it("should produce a base64 encoded hash", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const hash = hashKey(key);

			expect(typeof hash).toBe("string");
			// First 32 bytes encoded as base64 should be ~44 characters
			expect(hash.length).toBeGreaterThanOrEqual(40);
		});

		it("should produce consistent hash for same key", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);

			const hash1 = hashKey(key);
			const hash2 = hashKey(key);

			expect(hash1).toBe(hash2);
		});

		it("should produce different hashes for different keys", async () => {
			const salt = generateSalt();
			const key1 = await deriveKey("passphrase-one", salt);
			const key2 = await deriveKey("passphrase-two", salt);

			const hash1 = hashKey(key1);
			const hash2 = hashKey(key2);

			expect(hash1).not.toBe(hash2);
		});
	});

	describe("isE2EEncrypted", () => {
		it("should return true for valid E2EEncryptedData", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);
			const encrypted = encryptE2E("test", key);

			expect(isE2EEncrypted(encrypted)).toBe(true);
		});

		it("should return false for null", () => {
			expect(isE2EEncrypted(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			expect(isE2EEncrypted(undefined)).toBe(false);
		});

		it("should return false for strings", () => {
			expect(isE2EEncrypted("plain text")).toBe(false);
		});

		it("should return false for incomplete objects", () => {
			expect(isE2EEncrypted({ encrypted: "abc" })).toBe(false);
			expect(isE2EEncrypted({ encrypted: "abc", nonce: "def" })).toBe(false);
		});

		it("should return false for objects with wrong types", () => {
			expect(
				isE2EEncrypted({ encrypted: 123, nonce: "def", version: 1 }),
			).toBe(false);
			expect(
				isE2EEncrypted({ encrypted: "abc", nonce: "def", version: "1" }),
			).toBe(false);
		});

		it("should not confuse server EncryptedData with E2EEncryptedData", () => {
			// Server-side encrypted data has different structure
			const serverEncrypted = {
				ciphertext: "abc",
				iv: "def",
				authTag: "ghi",
				version: 1,
			};

			expect(isE2EEncrypted(serverEncrypted)).toBe(false);
		});
	});

	describe("generateRecoveryCode", () => {
		it("should generate a formatted recovery code", () => {
			const code = generateRecoveryCode();

			expect(typeof code).toBe("string");
			// Should have hyphens every 4 characters
			expect(code).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);
		});

		it("should generate unique recovery codes", () => {
			const code1 = generateRecoveryCode();
			const code2 = generateRecoveryCode();

			expect(code1).not.toBe(code2);
		});

		it("should only contain allowed characters", () => {
			const code = generateRecoveryCode();
			// Remove hyphens and check characters
			const chars = code.replace(/-/g, "");
			const allowedChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

			for (const char of chars) {
				expect(allowedChars.includes(char)).toBe(true);
			}
		});

		it("should not contain ambiguous characters (0, O, I, 1)", () => {
			// Generate many codes to increase confidence
			// The character set excludes: 0 (confused with O), O (confused with 0),
			// I (confused with 1), and 1 (confused with I or l)
			for (let i = 0; i < 100; i++) {
				const code = generateRecoveryCode();
				expect(code).not.toContain("0");
				expect(code).not.toContain("O");
				expect(code).not.toContain("I");
				expect(code).not.toContain("1");
			}
		});
	});

	describe("keyToString / stringToKey", () => {
		it("should convert key to string and back", async () => {
			const salt = generateSalt();
			const originalKey = await deriveKey("test-passphrase", salt);

			const keyString = keyToString(originalKey);
			const recoveredKey = stringToKey(keyString);

			expect(recoveredKey).toEqual(originalKey);
		});

		it("should produce base64 encoded string", async () => {
			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);

			const keyString = keyToString(key);

			// Base64 of 32 bytes should be 44 characters
			expect(keyString.length).toBe(44);
			expect(/^[A-Za-z0-9+/=]+$/.test(keyString)).toBe(true);
		});

		it("should handle empty key (edge case)", () => {
			const emptyKey = new Uint8Array(0);
			const keyString = keyToString(emptyKey);
			const recovered = stringToKey(keyString);

			expect(recovered).toEqual(emptyKey);
		});
	});

	describe("E2E encryption roundtrip", () => {
		it("should preserve data through full encryption cycle", async () => {
			const testCases = [
				"simple text",
				"with spaces and punctuation!",
				"unicode: 日本語 한국어 العربية",
				"emoji: 🔐🔑💾",
				'{"json": "data", "number": 123}',
				"   whitespace preserved   ",
				"\n\t\rnewlines and tabs",
			];

			const salt = generateSalt();
			const key = await deriveKey("test-passphrase", salt);

			for (const plaintext of testCases) {
				const encrypted = encryptE2E(plaintext, key);
				const decrypted = decryptE2E(encrypted, key);
				expect(decrypted).toBe(plaintext);
			}
		});

		it("should work with stored and restored key", async () => {
			const passphrase = "user-chosen-passphrase";
			const salt = generateSalt();

			// Simulate first session: derive key and encrypt
			const key1 = await deriveKey(passphrase, salt);
			const keyString = keyToString(key1);
			const encrypted = encryptE2E("secret data", key1);

			// Simulate second session: restore key and decrypt
			const key2 = stringToKey(keyString);
			const decrypted = decryptE2E(encrypted, key2);

			expect(decrypted).toBe("secret data");
		});

		it("should verify key using hash", async () => {
			const passphrase = "correct-passphrase";
			const salt = generateSalt();

			const originalKey = await deriveKey(passphrase, salt);
			const storedHash = hashKey(originalKey);

			// Later: user enters passphrase again
			const derivedKey = await deriveKey(passphrase, salt);
			const newHash = hashKey(derivedKey);

			expect(newHash).toBe(storedHash);

			// Wrong passphrase produces different hash
			const wrongKey = await deriveKey("wrong-passphrase", salt);
			const wrongHash = hashKey(wrongKey);

			expect(wrongHash).not.toBe(storedHash);
		});
	});
});

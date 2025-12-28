import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { isEncrypted } from "../src/server";
import {
	decryptArray,
	decryptBankAccountFields,
	decryptBillFields,
	decryptCounterpartyFields,
	decryptTransactionFields,
	decryptValue,
	encryptBankAccountFields,
	encryptBillFields,
	encryptCounterpartyFields,
	encryptTransactionFields,
	encryptValue,
	isEncryptionEnabled,
} from "../src/service";

// Valid 64-character hex key (32 bytes)
const TEST_KEY =
	"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("encryption service", () => {
	describe("without ENCRYPTION_KEY configured", () => {
		beforeEach(() => {
			delete process.env.ENCRYPTION_KEY;
		});

		describe("isEncryptionEnabled", () => {
			it("should return false when ENCRYPTION_KEY is not set", () => {
				expect(isEncryptionEnabled()).toBe(false);
			});

			it("should return false when ENCRYPTION_KEY has wrong length", () => {
				process.env.ENCRYPTION_KEY = "short";
				expect(isEncryptionEnabled()).toBe(false);
			});
		});

		describe("encryptValue", () => {
			it("should return original value when encryption is disabled", () => {
				const result = encryptValue("plain text");

				expect(result).toBe("plain text");
			});
		});

		describe("decryptValue", () => {
			it("should return original value when encryption is disabled", () => {
				const result = decryptValue("plain text");

				expect(result).toBe("plain text");
			});

			it("should throw error when trying to decrypt encrypted data without key", () => {
				const encryptedData = {
					ciphertext: "abc",
					iv: "def",
					authTag: "ghi",
					version: 1,
				};

				expect(() => decryptValue(encryptedData)).toThrow(
					"Cannot decrypt: ENCRYPTION_KEY not configured",
				);
			});
		});

		describe("domain-specific encryption functions", () => {
			it("should return transaction unchanged", () => {
				const transaction = {
					id: "123",
					description: "Groceries",
					notes: "Weekly shopping",
					amount: 100,
				};

				const result = encryptTransactionFields(transaction);
				expect(result).toEqual(transaction);
			});

			it("should return bill unchanged", () => {
				const bill = {
					id: "456",
					description: "Electricity",
					notes: "Monthly bill",
					amount: 50,
				};

				const result = encryptBillFields(bill);
				expect(result).toEqual(bill);
			});

			it("should return bank account unchanged", () => {
				const account = {
					id: "789",
					accountNumber: "1234567890",
					notes: "Primary account",
					bankName: "Test Bank",
				};

				const result = encryptBankAccountFields(account);
				expect(result).toEqual(account);
			});

			it("should return counterparty unchanged", () => {
				const counterparty = {
					id: "abc",
					name: "John Doe",
					notes: "Frequent vendor",
				};

				const result = encryptCounterpartyFields(counterparty);
				expect(result).toEqual(counterparty);
			});
		});
	});

	describe("with ENCRYPTION_KEY configured", () => {
		beforeEach(() => {
			process.env.ENCRYPTION_KEY = TEST_KEY;
		});

		afterEach(() => {
			delete process.env.ENCRYPTION_KEY;
		});

		describe("isEncryptionEnabled", () => {
			it("should return true when ENCRYPTION_KEY is properly set", () => {
				expect(isEncryptionEnabled()).toBe(true);
			});
		});

		describe("encryptValue / decryptValue", () => {
			it("should encrypt and decrypt values correctly", () => {
				const plaintext = "sensitive data";
				const encrypted = encryptValue(plaintext);

				expect(isEncrypted(encrypted)).toBe(true);

				const decrypted = decryptValue(encrypted);
				expect(decrypted).toBe(plaintext);
			});

			it("should handle already decrypted strings in decryptValue", () => {
				const result = decryptValue("plain text");
				expect(result).toBe("plain text");
			});
		});

		describe("encryptTransactionFields", () => {
			it("should encrypt description and notes fields", () => {
				const transaction = {
					id: "123",
					description: "Groceries",
					notes: "Weekly shopping",
					amount: 100,
				};

				const result = encryptTransactionFields(transaction);

				expect(result.id).toBe("123");
				expect(result.amount).toBe(100);
				expect(result.description).not.toBe("Groceries");
				expect(result.notes).not.toBe("Weekly shopping");

				// Encrypted values are JSON strings containing EncryptedData
				const parsedDescription = JSON.parse(result.description as string);
				const parsedNotes = JSON.parse(result.notes as string);

				expect(isEncrypted(parsedDescription)).toBe(true);
				expect(isEncrypted(parsedNotes)).toBe(true);
			});

			it("should preserve null fields", () => {
				const transaction = {
					id: "123",
					description: null,
					notes: null,
					amount: 100,
				};

				const result = encryptTransactionFields(transaction);

				expect(result.description).toBeNull();
				expect(result.notes).toBeNull();
			});

			it("should preserve undefined fields", () => {
				const transaction = {
					id: "123",
					amount: 100,
				};

				const result = encryptTransactionFields(transaction);

				expect(result.description).toBeUndefined();
				expect(result.notes).toBeUndefined();
			});
		});

		describe("decryptTransactionFields", () => {
			it("should decrypt encrypted transaction fields", () => {
				const original = {
					id: "123",
					description: "Groceries",
					notes: "Weekly shopping",
					amount: 100,
				};

				const encrypted = encryptTransactionFields(original);
				const decrypted = decryptTransactionFields(encrypted);

				expect(decrypted.description).toBe("Groceries");
				expect(decrypted.notes).toBe("Weekly shopping");
				expect(decrypted.id).toBe("123");
				expect(decrypted.amount).toBe(100);
			});

			it("should handle plain text fields (not encrypted)", () => {
				const transaction = {
					id: "123",
					description: "Plain text",
					notes: "Also plain",
					amount: 100,
				};

				const result = decryptTransactionFields(transaction);

				expect(result.description).toBe("Plain text");
				expect(result.notes).toBe("Also plain");
			});

			it("should preserve null fields during decryption", () => {
				const transaction = {
					id: "123",
					description: null,
					notes: null,
					amount: 100,
				};

				const result = decryptTransactionFields(transaction);

				expect(result.description).toBeNull();
				expect(result.notes).toBeNull();
			});
		});

		describe("encryptBillFields / decryptBillFields", () => {
			it("should encrypt and decrypt bill fields correctly", () => {
				const original = {
					id: "456",
					description: "Electricity bill",
					notes: "Monthly payment",
					amount: 150,
					dueDate: new Date(),
				};

				const encrypted = encryptBillFields(original);

				expect(encrypted.description).not.toBe("Electricity bill");
				expect(encrypted.notes).not.toBe("Monthly payment");
				expect(encrypted.dueDate).toEqual(original.dueDate);

				const decrypted = decryptBillFields(encrypted);

				expect(decrypted.description).toBe("Electricity bill");
				expect(decrypted.notes).toBe("Monthly payment");
			});

			it("should handle bill with only description", () => {
				const bill = {
					id: "456",
					description: "Just description",
					amount: 50,
				};

				const encrypted = encryptBillFields(bill);
				const decrypted = decryptBillFields(encrypted);

				expect(decrypted.description).toBe("Just description");
				expect(decrypted.notes).toBeUndefined();
			});
		});

		describe("encryptBankAccountFields / decryptBankAccountFields", () => {
			it("should encrypt and decrypt bank account fields correctly", () => {
				const original = {
					id: "789",
					accountNumber: "1234567890",
					notes: "Primary checking account",
					bankName: "Test Bank",
					routingNumber: "111222333",
				};

				const encrypted = encryptBankAccountFields(original);

				expect(encrypted.accountNumber).not.toBe("1234567890");
				expect(encrypted.notes).not.toBe("Primary checking account");
				expect(encrypted.bankName).toBe("Test Bank");
				expect(encrypted.routingNumber).toBe("111222333");

				const decrypted = decryptBankAccountFields(encrypted);

				expect(decrypted.accountNumber).toBe("1234567890");
				expect(decrypted.notes).toBe("Primary checking account");
			});

			it("should handle account without notes", () => {
				const account = {
					id: "789",
					accountNumber: "9876543210",
					bankName: "Other Bank",
				};

				const encrypted = encryptBankAccountFields(account);
				const decrypted = decryptBankAccountFields(encrypted);

				expect(decrypted.accountNumber).toBe("9876543210");
				expect(decrypted.notes).toBeUndefined();
			});
		});

		describe("encryptCounterpartyFields / decryptCounterpartyFields", () => {
			it("should encrypt and decrypt counterparty notes", () => {
				const original = {
					id: "abc",
					name: "John Doe",
					notes: "Preferred vendor, always reliable",
				};

				const encrypted = encryptCounterpartyFields(original);

				expect(encrypted.name).toBe("John Doe");
				expect(encrypted.notes).not.toBe("Preferred vendor, always reliable");

				const decrypted = decryptCounterpartyFields(encrypted);

				expect(decrypted.notes).toBe("Preferred vendor, always reliable");
			});

			it("should handle counterparty without notes", () => {
				const counterparty = {
					id: "abc",
					name: "Jane Smith",
				};

				const encrypted = encryptCounterpartyFields(counterparty);
				const decrypted = decryptCounterpartyFields(encrypted);

				expect(decrypted.name).toBe("Jane Smith");
				expect(decrypted.notes).toBeUndefined();
			});
		});

		describe("decryptArray", () => {
			it("should decrypt an array of items", () => {
				const transactions = [
					{ id: "1", description: "First", notes: "Note 1", amount: 10 },
					{ id: "2", description: "Second", notes: "Note 2", amount: 20 },
					{ id: "3", description: "Third", notes: null, amount: 30 },
				];

				const encrypted = transactions.map((t) => encryptTransactionFields(t));
				const decrypted = decryptArray(encrypted, decryptTransactionFields);

				expect(decrypted[0].description).toBe("First");
				expect(decrypted[0].notes).toBe("Note 1");
				expect(decrypted[1].description).toBe("Second");
				expect(decrypted[1].notes).toBe("Note 2");
				expect(decrypted[2].description).toBe("Third");
				expect(decrypted[2].notes).toBeNull();
			});

			it("should handle empty array", () => {
				const result = decryptArray([], decryptTransactionFields);
				expect(result).toEqual([]);
			});
		});

		describe("unicode and special characters", () => {
			it("should handle unicode in transaction fields", () => {
				const transaction = {
					id: "unicode",
					description: "Compra em 日本 🍣",
					notes: "Pagamento via 银行卡",
					amount: 100,
				};

				const encrypted = encryptTransactionFields(transaction);
				const decrypted = decryptTransactionFields(encrypted);

				expect(decrypted.description).toBe("Compra em 日本 🍣");
				expect(decrypted.notes).toBe("Pagamento via 银行卡");
			});

			it("should handle special characters in notes", () => {
				const counterparty = {
					id: "special",
					name: "Test",
					notes: 'Special: <>&"\'\\/ \n\t\r',
				};

				const encrypted = encryptCounterpartyFields(counterparty);
				const decrypted = decryptCounterpartyFields(encrypted);

				expect(decrypted.notes).toBe('Special: <>&"\'\\/ \n\t\r');
			});
		});

		describe("JSON field parsing edge cases", () => {
			it("should handle malformed JSON gracefully", () => {
				const transaction = {
					id: "malformed",
					description: "not valid json {",
					notes: "regular text",
					amount: 100,
				};

				// When decrypting plain text that looks like invalid JSON
				const result = decryptTransactionFields(transaction);

				expect(result.description).toBe("not valid json {");
				expect(result.notes).toBe("regular text");
			});

			it("should handle JSON that is not encrypted data", () => {
				const transaction = {
					id: "json-but-not-encrypted",
					description: '{"some": "json", "data": 123}',
					notes: "plain text",
					amount: 100,
				};

				const result = decryptTransactionFields(transaction);

				expect(result.description).toBe('{"some": "json", "data": 123}');
				expect(result.notes).toBe("plain text");
			});
		});
	});

	describe("encryption roundtrip across all domain types", () => {
		beforeEach(() => {
			process.env.ENCRYPTION_KEY = TEST_KEY;
		});

		afterEach(() => {
			delete process.env.ENCRYPTION_KEY;
		});

		it("should maintain data integrity through full cycle", () => {
			// Transaction
			const transaction = {
				description: "Test transaction",
				notes: "With notes",
			};
			expect(
				decryptTransactionFields(encryptTransactionFields(transaction)),
			).toEqual(transaction);

			// Bill
			const bill = { description: "Test bill", notes: "Bill notes" };
			expect(decryptBillFields(encryptBillFields(bill))).toEqual(bill);

			// Bank Account
			const account = { accountNumber: "12345", notes: "Account notes" };
			expect(decryptBankAccountFields(encryptBankAccountFields(account))).toEqual(
				account,
			);

			// Counterparty
			const counterparty = { notes: "Counterparty notes" };
			expect(
				decryptCounterpartyFields(encryptCounterpartyFields(counterparty)),
			).toEqual(counterparty);
		});
	});
});

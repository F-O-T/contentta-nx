/**
 * Encryption Service
 *
 * Provides server-side application-level encryption helpers for sensitive fields.
 * Uses AES-256-GCM encryption with the ENCRYPTION_KEY environment variable.
 *
 * Sensitive fields to encrypt:
 * - Transaction: description, notes
 * - Bill: description, notes
 * - Bank Account: accountNumber, notes
 * - Counterparty: notes
 */

import {
   decryptIfNeeded,
   encryptField,
   isEncrypted,
   type EncryptedData,
} from "./server";

/**
 * Gets the encryption key from environment
 * Returns null if encryption is not configured
 */
function getEncryptionKey(): string | null {
   const key = process.env.ENCRYPTION_KEY;
   if (!key || key.length !== 64) {
      return null;
   }
   return key;
}

/**
 * Checks if server-side encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
   return getEncryptionKey() !== null;
}

/**
 * Decrypts a field value if it contains encrypted data
 * Handles JSON parsing and encryption detection
 */
function decryptFieldValue(
   field: string | null | undefined,
   key: string,
): string | null | undefined {
   if (!field) return field;
   try {
      const parsed = JSON.parse(field);
      if (isEncrypted(parsed)) {
         return decryptIfNeeded(parsed, key);
      }
      return field;
   } catch {
      return field;
   }
}

/**
 * Encrypts a value if encryption is enabled
 * Returns the original value if encryption is not configured
 */
export function encryptValue(value: string): string | EncryptedData {
   const key = getEncryptionKey();
   if (!key) {
      return value;
   }
   return encryptField(value, key);
}

/**
 * Decrypts a value if it's encrypted
 * Returns the original value if not encrypted or encryption is not configured
 */
export function decryptValue(value: string | EncryptedData): string {
   const key = getEncryptionKey();
   if (!key) {
      if (isEncrypted(value)) {
         throw new Error("Cannot decrypt: ENCRYPTION_KEY not configured");
      }
      return value as string;
   }
   return decryptIfNeeded(value, key);
}

/**
 * Encrypts sensitive fields in a transaction
 */
export function encryptTransactionFields<
   T extends { description?: string | null; notes?: string | null },
>(transaction: T): T {
   const key = getEncryptionKey();
   if (!key) return transaction;

   return {
      ...transaction,
      description: transaction.description
         ? JSON.stringify(encryptField(transaction.description, key))
         : transaction.description,
      notes: transaction.notes
         ? JSON.stringify(encryptField(transaction.notes, key))
         : transaction.notes,
   };
}

/**
 * Decrypts sensitive fields in a transaction
 */
export function decryptTransactionFields<
   T extends { description?: string | null; notes?: string | null },
>(transaction: T): T {
   const key = getEncryptionKey();
   if (!key) return transaction;

   return {
      ...transaction,
      description: decryptFieldValue(transaction.description, key),
      notes: decryptFieldValue(transaction.notes, key),
   } as T;
}

/**
 * Encrypts sensitive fields in a bill
 */
export function encryptBillFields<
   T extends { description?: string | null; notes?: string | null },
>(bill: T): T {
   const key = getEncryptionKey();
   if (!key) return bill;

   return {
      ...bill,
      description: bill.description
         ? JSON.stringify(encryptField(bill.description, key))
         : bill.description,
      notes: bill.notes
         ? JSON.stringify(encryptField(bill.notes, key))
         : bill.notes,
   };
}

/**
 * Decrypts sensitive fields in a bill
 */
export function decryptBillFields<
   T extends { description?: string | null; notes?: string | null },
>(bill: T): T {
   const key = getEncryptionKey();
   if (!key) return bill;

   return {
      ...bill,
      description: decryptFieldValue(bill.description, key),
      notes: decryptFieldValue(bill.notes, key),
   } as T;
}

/**
 * Encrypts sensitive fields in a bank account
 */
export function encryptBankAccountFields<
   T extends { accountNumber?: string | null; notes?: string | null },
>(account: T): T {
   const key = getEncryptionKey();
   if (!key) return account;

   return {
      ...account,
      accountNumber: account.accountNumber
         ? JSON.stringify(encryptField(account.accountNumber, key))
         : account.accountNumber,
      notes: account.notes
         ? JSON.stringify(encryptField(account.notes, key))
         : account.notes,
   };
}

/**
 * Decrypts sensitive fields in a bank account
 */
export function decryptBankAccountFields<
   T extends { accountNumber?: string | null; notes?: string | null },
>(account: T): T {
   const key = getEncryptionKey();
   if (!key) return account;

   return {
      ...account,
      accountNumber: decryptFieldValue(account.accountNumber, key),
      notes: decryptFieldValue(account.notes, key),
   } as T;
}

/**
 * Encrypts sensitive fields in a counterparty
 */
export function encryptCounterpartyFields<T extends { notes?: string | null }>(
   counterparty: T,
): T {
   const key = getEncryptionKey();
   if (!key) return counterparty;

   return {
      ...counterparty,
      notes: counterparty.notes
         ? JSON.stringify(encryptField(counterparty.notes, key))
         : counterparty.notes,
   };
}

/**
 * Decrypts sensitive fields in a counterparty
 */
export function decryptCounterpartyFields<T extends { notes?: string | null }>(
   counterparty: T,
): T {
   const key = getEncryptionKey();
   if (!key) return counterparty;

   return {
      ...counterparty,
      notes: decryptFieldValue(counterparty.notes, key),
   } as T;
}

/**
 * Helper to decrypt an array of items
 */
export function decryptArray<T>(items: T[], decryptFn: (item: T) => T): T[] {
   return items.map(decryptFn);
}

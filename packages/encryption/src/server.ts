/**
 * Server-side Application-Level Encryption
 *
 * Uses AES-256-GCM for encrypting sensitive fields at rest.
 * The server manages the encryption key via ENCRYPTION_KEY environment variable.
 * This encryption is transparent to the user.
 */

import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
// Note: GCM auth tag is 128 bits (16 bytes) by default

export interface EncryptedData {
   ciphertext: string; // Base64 encoded encrypted data
   iv: string; // Base64 encoded initialization vector
   authTag: string; // Base64 encoded authentication tag
   version: number; // Encryption version for future upgrades
}

/**
 * Validates the encryption key format
 * Key should be a 32-byte (256-bit) hex string
 */
function validateKey(key: string): Buffer {
   // Explicitly validate hex format before Buffer conversion
   // Buffer.from(key, "hex") silently ignores non-hex characters
   if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      throw new Error(
         "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)",
      );
   }

   const keyBuffer = Buffer.from(key, "hex");

   // Safety check: verify buffer length after conversion
   if (keyBuffer.length !== 32) {
      throw new Error(
         "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)",
      );
   }

   return keyBuffer;
}

/**
 * Encrypts a field value using AES-256-GCM
 *
 * @param value - The plaintext value to encrypt
 * @param serverKey - The encryption key (64-character hex string)
 * @returns Encrypted data object with ciphertext, IV, and auth tag
 */
export function encryptField(value: string, serverKey: string): EncryptedData {
   if (!value) {
      throw new Error("Cannot encrypt empty value");
   }

   const key = validateKey(serverKey);
   const iv = randomBytes(IV_LENGTH);
   const cipher = createCipheriv(ALGORITHM, key, iv);

   let encrypted = cipher.update(value, "utf8", "base64");
   encrypted += cipher.final("base64");

   const authTag = cipher.getAuthTag();

   return {
      ciphertext: encrypted,
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      version: 1,
   };
}

/**
 * Decrypts a field value encrypted with encryptField
 *
 * @param encrypted - The encrypted data object
 * @param serverKey - The encryption key (64-character hex string)
 * @returns The decrypted plaintext value
 */
export function decryptField(
   encrypted: EncryptedData,
   serverKey: string,
): string {
   if (!encrypted || !encrypted.ciphertext) {
      throw new Error("Invalid encrypted data");
   }

   const key = validateKey(serverKey);
   const iv = Buffer.from(encrypted.iv, "base64");
   const authTag = Buffer.from(encrypted.authTag, "base64");

   const decipher = createDecipheriv(ALGORITHM, key, iv);
   decipher.setAuthTag(authTag);

   let decrypted = decipher.update(encrypted.ciphertext, "base64", "utf8");
   decrypted += decipher.final("utf8");

   return decrypted;
}

/**
 * Checks if a value is encrypted (has the EncryptedData structure)
 */
export function isEncrypted(value: unknown): value is EncryptedData {
   if (!value || typeof value !== "object") return false;
   const obj = value as Record<string, unknown>;
   return (
      typeof obj.ciphertext === "string" &&
      typeof obj.iv === "string" &&
      typeof obj.authTag === "string" &&
      typeof obj.version === "number"
   );
}

/**
 * Encrypts a field if it's not already encrypted, or returns the original
 * Useful for migrations and conditional encryption
 */
export function encryptIfNeeded(
   value: string | EncryptedData,
   serverKey: string,
): EncryptedData {
   if (isEncrypted(value)) {
      return value;
   }
   return encryptField(value, serverKey);
}

/**
 * Decrypts a field if it's encrypted, or returns the original string
 * Useful for reading fields that may or may not be encrypted
 */
export function decryptIfNeeded(
   value: string | EncryptedData,
   serverKey: string,
): string {
   if (isEncrypted(value)) {
      return decryptField(value, serverKey);
   }
   return value;
}

/**
 * Generates a new random encryption key
 * Use this to generate ENCRYPTION_KEY for .env
 */
export function generateEncryptionKey(): string {
   return randomBytes(32).toString("hex");
}

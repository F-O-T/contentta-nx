/**
 * Client-side End-to-End (E2E) Encryption
 *
 * Uses NaCl (tweetnacl) for encrypting data before it reaches the server.
 * The user's passphrase is used to derive the encryption key client-side.
 * The server never sees the plaintext data or the encryption key.
 *
 * PWA-compatible: Keys can be stored in sessionStorage or IndexedDB.
 */

import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

const KEY_LENGTH = nacl.secretbox.keyLength;
const SALT_LENGTH = 16;
const NONCE_LENGTH = nacl.secretbox.nonceLength;
const PBKDF2_ITERATIONS = 310_000;

export interface E2EEncryptedData {
   encrypted: string; // Base64 encoded encrypted data
   nonce: string; // Base64 encoded nonce
   version: number; // E2E encryption version
}

/**
 * Generates a cryptographically secure random salt
 */
export function generateSalt(): string {
   const salt = nacl.randomBytes(SALT_LENGTH);
   return naclUtil.encodeBase64(salt);
}

export async function deriveKey(
   passphrase: string,
   salt: string,
): Promise<Uint8Array> {
   if (!passphrase || passphrase.length < 8) {
      throw new Error("Passphrase must be at least 8 characters");
   }

   const saltBytes = naclUtil.decodeBase64(salt);
   const encoder = new TextEncoder();
   const passphraseBytes = encoder.encode(passphrase);

   const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passphraseBytes,
      "PBKDF2",
      false,
      ["deriveBits"],
   );

   const derivedBits = await crypto.subtle.deriveBits(
      {
         name: "PBKDF2",
         salt: new Uint8Array(saltBytes).buffer as ArrayBuffer,
         iterations: PBKDF2_ITERATIONS,
         hash: "SHA-512",
      },
      keyMaterial,
      KEY_LENGTH * 8,
   );

   return new Uint8Array(derivedBits);
}

/**
 * Encrypts data using NaCl secretbox (XSalsa20-Poly1305)
 *
 * @param value - The plaintext string to encrypt
 * @param key - The encryption key (from deriveKey)
 * @returns Encrypted data with nonce
 */
export function encryptE2E(value: string, key: Uint8Array): E2EEncryptedData {
   if (!value) {
      throw new Error("Cannot encrypt empty value");
   }

   if (key.length !== KEY_LENGTH) {
      throw new Error(`Key must be ${KEY_LENGTH} bytes`);
   }

   const nonce = nacl.randomBytes(NONCE_LENGTH);
   const messageBytes = naclUtil.decodeUTF8(value);
   const encrypted = nacl.secretbox(messageBytes, nonce, key);

   return {
      encrypted: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce),
      version: 1,
   };
}

/**
 * Decrypts data encrypted with encryptE2E
 *
 * @param data - The encrypted data object
 * @param key - The encryption key (from deriveKey)
 * @returns The decrypted plaintext string
 */
export function decryptE2E(data: E2EEncryptedData, key: Uint8Array): string {
   if (!data || !data.encrypted || !data.nonce) {
      throw new Error("Invalid encrypted data");
   }

   if (key.length !== KEY_LENGTH) {
      throw new Error(`Key must be ${KEY_LENGTH} bytes`);
   }

   const encrypted = naclUtil.decodeBase64(data.encrypted);
   const nonce = naclUtil.decodeBase64(data.nonce);
   const decrypted = nacl.secretbox.open(encrypted, nonce, key);

   if (!decrypted) {
      throw new Error("Decryption failed - invalid key or corrupted data");
   }

   return naclUtil.encodeUTF8(decrypted);
}

/**
 * Hashes the key to create a verification hash
 * Used to verify the user entered the correct passphrase without storing the key
 *
 * @param key - The encryption key
 * @returns Base64 encoded hash of the key
 */
export function hashKey(key: Uint8Array): string {
   const hash = nacl.hash(key);
   return naclUtil.encodeBase64(hash.slice(0, 32)); // Use first 32 bytes
}

/**
 * Checks if a value is E2E encrypted (has the E2EEncryptedData structure)
 */
export function isE2EEncrypted(value: unknown): value is E2EEncryptedData {
   if (!value || typeof value !== "object") return false;
   const obj = value as Record<string, unknown>;
   return (
      typeof obj.encrypted === "string" &&
      typeof obj.nonce === "string" &&
      typeof obj.version === "number"
   );
}

/**
 * Generates a random recovery code
 * This can be used to recover the encryption key if the user forgets their passphrase
 */
export function generateRecoveryCode(): string {
   const bytes = nacl.randomBytes(16);
   // Convert to readable format (base32-like)
   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
   let code = "";
   for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
         code += chars[byte % chars.length];
         if ((i + 1) % 4 === 0 && i < bytes.length - 1) {
            code += "-";
         }
      }
   }
   return code;
}

/**
 * Converts a Uint8Array key to a storable string format
 */
export function keyToString(key: Uint8Array): string {
   return naclUtil.encodeBase64(key);
}

/**
 * Converts a stored string back to a Uint8Array key
 */
export function stringToKey(keyString: string): Uint8Array {
   return naclUtil.decodeBase64(keyString);
}

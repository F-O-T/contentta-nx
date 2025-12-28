/**
 * @packages/encryption
 *
 * Two-tier encryption system for Montte:
 *
 * 1. Application-Level Encryption (server.ts)
 *    - Server encrypts sensitive fields with ENCRYPTION_KEY environment variable
 *    - Transparent to user - no action required
 *    - Server can still search/query encrypted data (decrypts on server)
 *
 * 2. End-to-End (E2E) Encryption (client.ts)
 *    - User creates passphrase, key derived client-side via PBKDF2
 *    - Data encrypted in browser BEFORE sending to server
 *    - Server stores only encrypted blobs - cannot read data
 *    - Limitations: No server-side search, reports show encrypted values
 */

// Server-side encryption exports
export {
   encryptField,
   decryptField,
   isEncrypted,
   type EncryptedData,
} from "./server";

// Client-side E2E encryption exports
export {
   deriveKey,
   encryptE2E,
   decryptE2E,
   generateSalt,
   hashKey,
   type E2EEncryptedData,
} from "./client";

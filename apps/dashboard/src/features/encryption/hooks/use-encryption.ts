/**
 * Client-side E2E Encryption Hook
 *
 * Provides encryption/decryption functions using the stored key.
 * All encryption happens client-side before data is sent to the server.
 */

import {
   decryptE2E,
   deriveKey,
   type E2EEncryptedData,
   encryptE2E,
   generateSalt,
   hashKey,
   isE2EEncrypted,
   keyToString,
   stringToKey,
} from "@packages/encryption/client";
import { useCallback, useMemo } from "react";
import { useEncryptionKeyStorage } from "./use-encryption-key-storage";

export interface UseEncryptionReturn {
   /** Whether the E2E key is available for encryption/decryption */
   isUnlocked: boolean;
   /** Whether the storage has been initialized */
   isInitialized: boolean;
   /** Encrypt a value (returns JSON string of E2EEncryptedData) */
   encrypt: (value: string) => string;
   /** Decrypt a value (accepts JSON string of E2EEncryptedData or raw E2EEncryptedData) */
   decrypt: (encrypted: string | E2EEncryptedData) => string;
   /** Derive key from passphrase and store it */
   unlock: (
      passphrase: string,
      salt: string,
      remember?: boolean,
   ) => Promise<{ key: Uint8Array; keyHash: string }>;
   /** Clear the stored key */
   lock: () => Promise<void>;
   /** Generate a new salt for encryption setup */
   generateNewSalt: () => string;
   /** Get the hash of the current key (for verification) */
   getCurrentKeyHash: () => string | null;
}

/**
 * Hook for client-side E2E encryption operations.
 */
export function useEncryption(): UseEncryptionReturn {
   const { storedKey, isInitialized, storeKey, clearKey, hasStoredKey } =
      useEncryptionKeyStorage();

   // Get the key as Uint8Array from stored base64 string
   const key = useMemo(() => {
      if (!storedKey) return null;
      try {
         return stringToKey(storedKey);
      } catch {
         return null;
      }
   }, [storedKey]);

   const encrypt = useCallback(
      (value: string): string => {
         if (!key) {
            throw new Error(
               "Encryption key not available. Please unlock first.",
            );
         }
         const encrypted = encryptE2E(value, key);
         return JSON.stringify(encrypted);
      },
      [key],
   );

   const decrypt = useCallback(
      (encrypted: string | E2EEncryptedData): string => {
         if (!key) {
            throw new Error(
               "Encryption key not available. Please unlock first.",
            );
         }

         let data: E2EEncryptedData;
         if (typeof encrypted === "string") {
            try {
               data = JSON.parse(encrypted);
            } catch {
               // If it's not JSON, return as-is (not encrypted)
               return encrypted;
            }
         } else {
            data = encrypted;
         }

         if (!isE2EEncrypted(data)) {
            // Not encrypted data, return as-is
            return typeof encrypted === "string"
               ? encrypted
               : JSON.stringify(encrypted);
         }

         return decryptE2E(data, key);
      },
      [key],
   );

   const unlock = useCallback(
      async (
         passphrase: string,
         salt: string,
         remember = false,
      ): Promise<{ key: Uint8Array; keyHash: string }> => {
         const derivedKey = await deriveKey(passphrase, salt);
         const keyHash = hashKey(derivedKey);
         const keyString = keyToString(derivedKey);

         await storeKey(keyString, remember);

         return { key: derivedKey, keyHash };
      },
      [storeKey],
   );

   const lock = useCallback(async (): Promise<void> => {
      await clearKey();
   }, [clearKey]);

   const generateNewSalt = useCallback((): string => {
      return generateSalt();
   }, []);

   const getCurrentKeyHash = useCallback((): string | null => {
      if (!key) return null;
      return hashKey(key);
   }, [key]);

   return {
      isUnlocked: hasStoredKey && key !== null,
      isInitialized,
      encrypt,
      decrypt,
      unlock,
      lock,
      generateNewSalt,
      getCurrentKeyHash,
   };
}

/**
 * Utility to check if a value is E2E encrypted
 */
export { isE2EEncrypted };
export type { E2EEncryptedData };

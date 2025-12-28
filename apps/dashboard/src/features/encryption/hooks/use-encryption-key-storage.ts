/**
 * PWA-Compatible Encryption Key Storage
 *
 * Stores the derived encryption key securely in the browser.
 * Uses sessionStorage by default (cleared on tab close) with an option
 * to use IndexedDB for "remember device" functionality.
 *
 * Works on both desktop browsers and PWA installations.
 */

import { useCallback, useEffect, useState } from "react";

const SESSION_STORAGE_KEY = "montte-e2e-key";
const IDB_DB_NAME = "montte-encryption";
const IDB_STORE_NAME = "keys";
const IDB_KEY_ID = "e2e-key";

interface StoredKey {
   key: string; // Base64 encoded key
   expiresAt?: number; // Optional expiration timestamp
}

/**
 * Opens the IndexedDB database for key storage
 */
function openDatabase(): Promise<IDBDatabase> {
   return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
         const db = (event.target as IDBOpenDBRequest).result;
         if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
            db.createObjectStore(IDB_STORE_NAME, { keyPath: "id" });
         }
      };
   });
}

/**
 * Stores key in IndexedDB
 */
async function storeInIndexedDB(
   key: string,
   expiresAt?: number,
): Promise<void> {
   const db = await openDatabase();
   return new Promise((resolve, reject) => {
      const transaction = db.transaction(IDB_STORE_NAME, "readwrite");
      const store = transaction.objectStore(IDB_STORE_NAME);
      const request = store.put({
         id: IDB_KEY_ID,
         key,
         expiresAt,
      });

      request.onerror = () => {
         db.close();
         reject(request.error);
      };
      transaction.oncomplete = () => {
         db.close();
         resolve();
      };
      transaction.onerror = () => {
         db.close();
         reject(transaction.error);
      };
   });
}

/**
 * Retrieves key from IndexedDB
 */
async function getFromIndexedDB(): Promise<StoredKey | null> {
   try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
         const transaction = db.transaction(IDB_STORE_NAME, "readonly");
         const store = transaction.objectStore(IDB_STORE_NAME);
         const request = store.get(IDB_KEY_ID);
         let result: StoredKey | undefined;

         request.onerror = () => {
            db.close();
            reject(request.error);
         };
         request.onsuccess = () => {
            result = request.result as StoredKey | undefined;
         };
         transaction.oncomplete = () => {
            db.close();
            if (result?.expiresAt && Date.now() > result.expiresAt) {
               // Key expired, remove it
               clearFromIndexedDB().catch(console.error);
               resolve(null);
            } else {
               resolve(result || null);
            }
         };
         transaction.onerror = () => {
            db.close();
            reject(transaction.error);
         };
      });
   } catch {
      return null;
   }
}

/**
 * Clears key from IndexedDB
 */
async function clearFromIndexedDB(): Promise<void> {
   try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
         const transaction = db.transaction(IDB_STORE_NAME, "readwrite");
         const store = transaction.objectStore(IDB_STORE_NAME);
         const request = store.delete(IDB_KEY_ID);

         request.onerror = () => {
            db.close();
            reject(request.error);
         };
         transaction.oncomplete = () => {
            db.close();
            resolve();
         };
         transaction.onerror = () => {
            db.close();
            reject(transaction.error);
         };
      });
   } catch {
      // Ignore errors when clearing
   }
}

export interface UseEncryptionKeyStorageReturn {
   /** The stored key as base64 string, or null if not stored */
   storedKey: string | null;
   /** Whether the storage has been initialized */
   isInitialized: boolean;
   /** Store a key (base64 encoded) */
   storeKey: (
      key: string,
      remember?: boolean,
      expirationDays?: number,
   ) => Promise<void>;
   /** Clear the stored key */
   clearKey: () => Promise<void>;
   /** Check if a key is stored */
   hasStoredKey: boolean;
}

/**
 * Hook for managing encryption key storage in the browser.
 * PWA-compatible with support for both sessionStorage and IndexedDB.
 */
export function useEncryptionKeyStorage(): UseEncryptionKeyStorageReturn {
   const [storedKey, setStoredKey] = useState<string | null>(null);
   const [isInitialized, setIsInitialized] = useState(false);

   // Initialize - check for stored key on mount
   useEffect(() => {
      const init = async () => {
         // First check sessionStorage (temporary key)
         const sessionKey = sessionStorage.getItem(SESSION_STORAGE_KEY);
         if (sessionKey) {
            setStoredKey(sessionKey);
            setIsInitialized(true);
            return;
         }

         // Then check IndexedDB (remembered key)
         const idbResult = await getFromIndexedDB();
         if (idbResult) {
            setStoredKey(idbResult.key);
            // Also put in sessionStorage for faster access
            sessionStorage.setItem(SESSION_STORAGE_KEY, idbResult.key);
         }

         setIsInitialized(true);
      };

      init();
   }, []);

   const storeKey = useCallback(
      async (
         key: string,
         remember = false,
         expirationDays = 30,
      ): Promise<void> => {
         // Always store in sessionStorage for current session
         sessionStorage.setItem(SESSION_STORAGE_KEY, key);
         setStoredKey(key);

         // If remember is true, also store in IndexedDB
         if (remember) {
            const expiresAt = Date.now() + expirationDays * 24 * 60 * 60 * 1000;
            await storeInIndexedDB(key, expiresAt);
         }
      },
      [],
   );

   const clearKey = useCallback(async (): Promise<void> => {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      await clearFromIndexedDB();
      setStoredKey(null);
   }, []);

   return {
      storedKey,
      isInitialized,
      storeKey,
      clearKey,
      hasStoredKey: storedKey !== null,
   };
}

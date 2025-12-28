/**
 * Encryption Context Provider
 *
 * Provides encryption state and functions to the entire app.
 * Manages E2E encryption status, unlock state, and prompts for passphrase.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext } from "react";
import { trpc } from "@/integrations/clients";
import { type E2EEncryptedData, useEncryption } from "./use-encryption";

interface EncryptionContextValue {
   /** Whether server-side encryption is enabled */
   serverEncryptionEnabled: boolean;
   /** Whether E2E encryption is enabled for the user */
   e2eEnabled: boolean;
   /** Whether the E2E key is unlocked (ready for encryption/decryption) */
   isUnlocked: boolean;
   /** Whether the encryption state is loading */
   isLoading: boolean;
   /** Whether we need to prompt for passphrase */
   needsUnlock: boolean;
   /** Encrypt a value (E2E) */
   encrypt: (value: string) => string;
   /** Decrypt a value (E2E) */
   decrypt: (encrypted: string | E2EEncryptedData) => string;
   /** Unlock with passphrase */
   unlock: (passphrase: string, remember?: boolean) => Promise<boolean>;
   /** Lock (clear key from storage) */
   lock: () => Promise<void>;
   /** Enable E2E encryption with a new passphrase */
   enableE2E: (passphrase: string) => Promise<boolean>;
   /** Disable E2E encryption */
   disableE2E: (
      passphrase: string,
      confirmDataLoss: boolean,
   ) => Promise<boolean>;
   /** Refetch encryption status */
   refetch: () => void;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

export function EncryptionProvider({ children }: { children: ReactNode }) {
   const {
      isUnlocked,
      isInitialized,
      encrypt,
      decrypt,
      unlock: unlockWithKey,
      lock: lockKey,
      generateNewSalt,
   } = useEncryption();

   // Get encryption status from server
   const {
      data: encryptionStatus,
      isLoading: isStatusLoading,
      refetch,
   } = useQuery(trpc.encryption.getStatus.queryOptions());

   // Get salt for unlocking
   const { data: salt } = useQuery({
      ...trpc.encryption.getSalt.queryOptions(),
      enabled: encryptionStatus?.e2eEnabled ?? false,
   });

   // Mutations
   const enableMutation = useMutation(trpc.encryption.enable.mutationOptions());
   const disableMutation = useMutation(
      trpc.encryption.disable.mutationOptions(),
   );
   const verifyMutation = useMutation(
      trpc.encryption.verifyKeyHash.mutationOptions(),
   );

   const isLoading = isStatusLoading || !isInitialized;

   const e2eEnabled = encryptionStatus?.e2eEnabled ?? false;
   const serverEncryptionEnabled =
      encryptionStatus?.serverEncryptionEnabled ?? false;

   // Need unlock if E2E is enabled but key is not available
   const needsUnlock = e2eEnabled && !isUnlocked;

   const unlock = useCallback(
      async (passphrase: string, remember = false): Promise<boolean> => {
         if (!salt) {
            return false;
         }

         try {
            const { keyHash } = await unlockWithKey(passphrase, salt, remember);

            // Verify the key hash with the server
            const result = await verifyMutation.mutateAsync({ keyHash });

            if (!result.valid) {
               await lockKey();
               return false;
            }

            return true;
         } catch {
            await lockKey();
            return false;
         }
      },
      [salt, unlockWithKey, verifyMutation, lockKey],
   );

   const lock = useCallback(async (): Promise<void> => {
      await lockKey();
   }, [lockKey]);

   const enableE2E = useCallback(
      async (passphrase: string): Promise<boolean> => {
         try {
            const newSalt = generateNewSalt();
            const { keyHash } = await unlockWithKey(passphrase, newSalt, false);

            await enableMutation.mutateAsync({
               salt: newSalt,
               keyHash,
            });

            await refetch();
            return true;
         } catch (error) {
            console.error("Failed to enable E2E encryption:", error);
            return false;
         }
      },
      [generateNewSalt, unlockWithKey, enableMutation, refetch],
   );

   const disableE2E = useCallback(
      async (
         passphrase: string,
         confirmDataLoss: boolean,
      ): Promise<boolean> => {
         if (!salt) return false;

         try {
            const { keyHash } = await unlockWithKey(passphrase, salt, false);

            await disableMutation.mutateAsync({
               keyHash,
               confirmDataLoss,
            });

            await lockKey();
            await refetch();
            return true;
         } catch (error) {
            console.error("Failed to disable E2E encryption:", error);
            return false;
         }
      },
      [salt, unlockWithKey, disableMutation, lockKey, refetch],
   );

   // Safe encrypt/decrypt that handle unlocked state
   const safeEncrypt = useCallback(
      (value: string): string => {
         if (!isUnlocked) {
            throw new Error("E2E encryption key not unlocked");
         }
         return encrypt(value);
      },
      [isUnlocked, encrypt],
   );

   const safeDecrypt = useCallback(
      (encrypted: string | E2EEncryptedData): string => {
         if (!isUnlocked) {
            // If not unlocked, return placeholder
            return "[Encrypted]";
         }
         try {
            return decrypt(encrypted);
         } catch {
            return "[Decryption failed]";
         }
      },
      [isUnlocked, decrypt],
   );

   const value: EncryptionContextValue = {
      serverEncryptionEnabled,
      e2eEnabled,
      isUnlocked,
      isLoading,
      needsUnlock,
      encrypt: safeEncrypt,
      decrypt: safeDecrypt,
      unlock,
      lock,
      enableE2E,
      disableE2E,
      refetch: () => {
         refetch();
      },
   };

   return (
      <EncryptionContext.Provider value={value}>
         {children}
      </EncryptionContext.Provider>
   );
}

export function useEncryptionContext(): EncryptionContextValue {
   const context = useContext(EncryptionContext);
   if (!context) {
      throw new Error(
         "useEncryptionContext must be used within EncryptionProvider",
      );
   }
   return context;
}

/**
 * Hook to get just the unlock status without full context
 * Useful for conditional rendering
 */
export function useIsE2EUnlocked(): boolean {
   const context = useContext(EncryptionContext);
   return context?.isUnlocked ?? false;
}

/**
 * Hook to check if E2E is enabled
 */
export function useIsE2EEnabled(): boolean {
   const context = useContext(EncryptionContext);
   return context?.e2eEnabled ?? false;
}

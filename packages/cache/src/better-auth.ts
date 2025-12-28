import type { Redis } from "ioredis";

export interface SecondaryStorage {
   get: (key: string) => Promise<string | null>;
   set: (key: string, value: string, ttl?: number) => Promise<void>;
   delete: (key: string) => Promise<void>;
}

export interface BetterAuthStorageOptions {
   prefix?: string;
}

export function createBetterAuthStorage(
   redis: Redis,
   options: BetterAuthStorageOptions = {},
): SecondaryStorage {
   const prefix = options.prefix ?? "better-auth:";

   const prefixKey = (key: string): string => `${prefix}${key}`;

   return {
      async get(key: string): Promise<string | null> {
         try {
            return await redis.get(prefixKey(key));
         } catch (error) {
            console.error(`[BetterAuth Storage] Error getting key ${key}:`, error);
            return null;
         }
      },

      async set(key: string, value: string, ttl?: number): Promise<void> {
         try {
            const prefixed = prefixKey(key);
            if (ttl !== undefined && ttl > 0) {
               await redis.set(prefixed, value, "EX", ttl);
            } else {
               await redis.set(prefixed, value);
            }
         } catch (error) {
            console.error(`[BetterAuth Storage] Error setting key ${key}:`, error);
         }
      },

      async delete(key: string): Promise<void> {
         try {
            await redis.del(prefixKey(key));
         } catch (error) {
            console.error(`[BetterAuth Storage] Error deleting key ${key}:`, error);
         }
      },
   };
}

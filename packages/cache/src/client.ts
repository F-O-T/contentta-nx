import type { Redis } from "ioredis";

export const TTL = {
   SHORT: 5 * 60, // 5 minutes
   MEDIUM: 60 * 60, // 1 hour
   LONG: 24 * 60 * 60, // 24 hours
   WEEK: 7 * 24 * 60 * 60, // 7 days
} as const;

export interface CacheOptions {
   prefix?: string;
   defaultTTL?: number;
}

export interface CacheClient {
   get(key: string): Promise<string | null>;
   getJSON<T>(key: string): Promise<T | null>;
   set(key: string, value: string, ttlSeconds?: number): Promise<void>;
   setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
   delete(key: string): Promise<void>;
   exists(key: string): Promise<boolean>;
   ttl(key: string): Promise<number>;
   getRedis(): Redis;
}

export function createCacheClient(
   redis: Redis,
   options: CacheOptions = {},
): CacheClient {
   const { prefix = "", defaultTTL } = options;

   const prefixKey = (key: string): string => `${prefix}${key}`;

   return {
      async get(key: string): Promise<string | null> {
         return redis.get(prefixKey(key));
      },

      async getJSON<T>(key: string): Promise<T | null> {
         const value = await redis.get(prefixKey(key));
         if (value === null) return null;
         try {
            return JSON.parse(value) as T;
         } catch {
            console.error(`[Cache] Failed to parse JSON for key: ${key}`);
            return null;
         }
      },

      async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
         const ttl = ttlSeconds ?? defaultTTL;
         const prefixed = prefixKey(key);

         if (ttl !== undefined && ttl > 0) {
            await redis.set(prefixed, value, "EX", ttl);
         } else {
            await redis.set(prefixed, value);
         }
      },

      async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
         const serialized = JSON.stringify(value);
         const ttl = ttlSeconds ?? defaultTTL;
         const prefixed = prefixKey(key);

         if (ttl !== undefined && ttl > 0) {
            await redis.set(prefixed, serialized, "EX", ttl);
         } else {
            await redis.set(prefixed, serialized);
         }
      },

      async delete(key: string): Promise<void> {
         await redis.del(prefixKey(key));
      },

      async exists(key: string): Promise<boolean> {
         const result = await redis.exists(prefixKey(key));
         return result === 1;
      },

      async ttl(key: string): Promise<number> {
         return redis.ttl(prefixKey(key));
      },

      getRedis(): Redis {
         return redis;
      },
   };
}

import type { ConnectionOptions } from "bullmq";
import type { Redis as BullMQRedis } from "ioredis";
import {
   createRedisConnection as cacheCreateRedisConnection,
   closeRedisConnection,
   getRedisConnection as cacheGetRedisConnection,
} from "@packages/cache/connection";

// Re-export close function as-is
export { closeRedisConnection };

// Wrap createRedisConnection to return BullMQ-compatible type
export function createRedisConnection(url: string): BullMQRedis {
   return cacheCreateRedisConnection(url) as unknown as BullMQRedis;
}

// Wrap getRedisConnection to return BullMQ-compatible type
export function getRedisConnection(): BullMQRedis | null {
   return cacheGetRedisConnection() as unknown as BullMQRedis | null;
}

// Export Redis type from ioredis (BullMQ-compatible)
export type { BullMQRedis as Redis };

// BullMQ-specific: returns a connection options type
export function getConnectionOptions(url: string): ConnectionOptions {
   return createRedisConnection(url);
}

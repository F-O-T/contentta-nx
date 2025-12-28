import { Redis } from "ioredis";

let redisConnection: Redis | null = null;

export function createRedisConnection(url: string): Redis {
   if (redisConnection) {
      return redisConnection;
   }

   redisConnection = new Redis(`${url}?family=6`, {
      maxRetriesPerRequest: null,
   });

   redisConnection.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
   });

   redisConnection.on("connect", () => {
      console.log("[Redis] Connected successfully");
   });

   return redisConnection;
}

export async function closeRedisConnection(): Promise<void> {
   if (redisConnection) {
      await redisConnection.quit();
      redisConnection = null;
      console.log("[Redis] Connection closed");
   }
}

export function getRedisConnection(): Redis | null {
   return redisConnection;
}

export type { Redis };

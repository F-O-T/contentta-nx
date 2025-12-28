import { createRedisConnection, type Redis } from "@packages/cache/connection";
import { serverEnv } from "@packages/environment/server";
import {
   CHANNELS,
   type ContentStatusEvent,
   ContentStatusEventSchema,
} from "./events";

let publisherConnection: Redis | null = null;

function getPublisher(): Redis {
   if (!publisherConnection) {
      publisherConnection = createRedisConnection(serverEnv.REDIS_URL);
   }
   return publisherConnection;
}

export async function emitContentStatusChanged(
   payload: Omit<ContentStatusEvent, "timestamp">,
): Promise<void> {
   const event: ContentStatusEvent = {
      ...payload,
      timestamp: Date.now(),
   };

   const validated = ContentStatusEventSchema.parse(event);
   const channel = CHANNELS.contentStatus(validated.contentId);

   const publisher = getPublisher();
   await publisher.publish(channel, JSON.stringify(validated));

   console.log(
      `[ServerEvents] Published to ${channel}: ${validated.status} - ${validated.message}`,
   );
}

export async function closePublisher(): Promise<void> {
   if (publisherConnection) {
      await publisherConnection.quit();
      publisherConnection = null;
   }
}

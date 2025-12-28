import { Redis } from "ioredis";
import { serverEnv } from "@packages/environment/server";
import {
   CHANNELS,
   type ContentStatusEvent,
   ContentStatusEventSchema,
} from "./events";

export type ContentStatusCallback = (event: ContentStatusEvent) => void;

export function subscribeToContentStatus(
   contentId: string,
   callback: ContentStatusCallback,
): () => void {
   const subscriber = new Redis(`${serverEnv.REDIS_URL}?family=6`, {
      maxRetriesPerRequest: null,
   });

   const channel = CHANNELS.contentStatus(contentId);

   subscriber.subscribe(channel, (err) => {
      if (err) {
         console.error(`[ServerEvents] Failed to subscribe to ${channel}:`, err);
         return;
      }
      console.log(`[ServerEvents] Subscribed to ${channel}`);
   });

   subscriber.on("message", (receivedChannel, message) => {
      if (receivedChannel === channel) {
         try {
            const parsed = JSON.parse(message);
            const validated = ContentStatusEventSchema.parse(parsed);
            callback(validated);
         } catch (error) {
            console.error(
               `[ServerEvents] Failed to parse message from ${channel}:`,
               error,
            );
         }
      }
   });

   subscriber.on("error", (err) => {
      console.error(`[ServerEvents] Subscriber error for ${channel}:`, err);
   });

   return () => {
      subscriber.unsubscribe(channel);
      subscriber.quit();
      console.log(`[ServerEvents] Unsubscribed from ${channel}`);
   };
}

export function createSubscriberConnection(): Redis {
   return new Redis(`${serverEnv.REDIS_URL}?family=6`, {
      maxRetriesPerRequest: null,
   });
}

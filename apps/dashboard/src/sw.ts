/// <reference lib="webworker" />

import { BackgroundSyncPlugin } from "workbox-background-sync";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import {
   cleanupOutdatedCaches,
   createHandlerBoundToURL,
   precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import {
   CacheFirst,
   NetworkFirst,
   StaleWhileRevalidate,
} from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

const CACHE_VERSION = "v1";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("fetch", (event: FetchEvent) => {
   const url = new URL(event.request.url);

   if (url.pathname === "/share-target" && event.request.method === "POST") {
      event.respondWith(
         (async () => {
            try {
               const formData = await event.request.formData();
               const file = formData.get("file");

               if (file && file instanceof File) {
                  const content = await file.text();

                  const cache = await caches.open("share-target-temp");
                  await cache.put(
                     "pending-share",
                     new Response(
                        JSON.stringify({ content, filename: file.name }),
                        {
                           headers: { "Content-Type": "application/json" },
                        },
                     ),
                  );

                  const clients = await self.clients.matchAll({
                     type: "window",
                  });
                  for (const client of clients) {
                     client.postMessage({
                        data: { content, filename: file.name },
                        type: "SHARE_TARGET_FILE",
                     });
                  }

                  return Response.redirect(
                     "/share-target?hasContent=true",
                     303,
                  );
               }

               return Response.redirect("/share-target", 303);
            } catch (error) {
               console.error("Error handling share target:", error);
               return Response.redirect("/share-target?error=true", 303);
            }
         })(),
      );
      return;
   }
});

const navigationHandler = createHandlerBoundToURL("/index.html");
const navigationRoute = new NavigationRoute(navigationHandler, {
   denylist: [/^\/api\//, /^\/trpc\//, /^\/share-target/, /^\/file-handler/],
});
registerRoute(navigationRoute);

registerRoute(
   ({ url }) =>
      url.origin === "https://fonts.googleapis.com" ||
      url.origin === "https://fonts.gstatic.com",
   new CacheFirst({
      cacheName: "google-fonts-cache",
      plugins: [
         new CacheableResponsePlugin({ statuses: [0, 200] }),
         new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24 * 365,
            maxEntries: 30,
         }),
      ],
   }),
);

registerRoute(
   ({ request }) => request.destination === "image",
   new CacheFirst({
      cacheName: "images-cache",
      plugins: [
         new CacheableResponsePlugin({ statuses: [0, 200] }),
         new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24 * 30,
            maxEntries: 100,
         }),
      ],
   }),
);

registerRoute(
   ({ request }) =>
      request.destination === "style" || request.destination === "script",
   new StaleWhileRevalidate({
      cacheName: "static-resources",
      plugins: [
         new CacheableResponsePlugin({ statuses: [0, 200] }),
         new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24 * 7,
            maxEntries: 50,
         }),
      ],
   }),
);

const bgSyncPlugin = new BackgroundSyncPlugin("api-queue", {
   maxRetentionTime: 24 * 60,
   onSync: async ({ queue }) => {
      let entry = await queue.shiftRequest();
      while (entry) {
         try {
            await fetch(entry.request);
         } catch (error) {
            await queue.unshiftRequest(entry);
            throw error;
         }
         entry = await queue.shiftRequest();
      }
   },
});

registerRoute(
   ({ url }) =>
      url.pathname.startsWith("/trpc/") || url.pathname.startsWith("/api/"),
   new NetworkFirst({
      cacheName: API_CACHE,
      networkTimeoutSeconds: 10,
      plugins: [
         new CacheableResponsePlugin({ statuses: [0, 200] }),
         new ExpirationPlugin({
            maxAgeSeconds: 60 * 5,
            maxEntries: 50,
         }),
         bgSyncPlugin,
      ],
   }),
   "GET",
);

registerRoute(
   ({ url }) =>
      url.pathname.startsWith("/trpc/") || url.pathname.startsWith("/api/"),
   async ({ request }) => {
      try {
         return await fetch(request);
      } catch {
         return new Response(
            JSON.stringify({
               error: "offline",
               message:
                  "Você está offline. A requisição será enviada quando voltar online.",
            }),
            {
               headers: { "Content-Type": "application/json" },
               status: 503,
            },
         );
      }
   },
   "POST",
);

interface PushNotificationData {
   title?: string;
   body?: string;
   icon?: string;
   badge?: string;
   tag?: string;
   data?: {
      url?: string;
      type?: string;
      [key: string]: unknown;
   };
   actions?: Array<{
      action: string;
      title: string;
      icon?: string;
   }>;
   requireInteraction?: boolean;
   silent?: boolean;
   vibrate?: number[];
}

self.addEventListener("push", (event: PushEvent) => {
   if (!event.data) {
      console.warn("Push event received without data");
      return;
   }

   let payload: PushNotificationData;
   try {
      payload = event.data.json();
   } catch {
      payload = { body: event.data.text() };
   }

   const title = payload.title || "Montte";
   const options: NotificationOptions & { vibrate?: number[] } = {
      badge: payload.badge || "/android/android-launchericon-96-96.png",
      body: payload.body || "Você tem uma nova notificação",
      data: payload.data || {},
      icon: payload.icon || "/android/android-launchericon-192-192.png",
      requireInteraction: payload.requireInteraction ?? false,
      silent: payload.silent ?? false,
      tag: payload.tag || `montte-${Date.now()}`,
      vibrate: payload.vibrate || [100, 50, 100],
   };

   event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
   event.notification.close();

   const notificationData = event.notification.data || {};
   let targetUrl = "/";

   if (event.action) {
      switch (event.action) {
         case "view":
            targetUrl = notificationData.url || "/";
            break;
         case "dismiss":
            return;
         default:
            targetUrl = notificationData.url || "/";
      }
   } else {
      targetUrl = notificationData.url || "/";
   }

   event.waitUntil(
      self.clients
         .matchAll({ includeUncontrolled: true, type: "window" })
         .then((clientList) => {
            for (const client of clientList) {
               if (
                  client.url.includes(self.location.origin) &&
                  "focus" in client
               ) {
                  client.postMessage({
                     data: notificationData,
                     type: "NOTIFICATION_CLICK",
                     url: targetUrl,
                  });
                  return client.focus();
               }
            }
            if (self.clients.openWindow) {
               return self.clients.openWindow(targetUrl);
            }
         }),
   );
});

self.addEventListener("notificationclose", (event: NotificationEvent) => {
   const notificationData = event.notification.data || {};

   self.clients.matchAll({ type: "window" }).then((clients) => {
      clients.forEach((client) => {
         client.postMessage({
            data: notificationData,
            type: "NOTIFICATION_CLOSED",
         });
      });
   });
});

self.addEventListener("pushsubscriptionchange", (event: Event) => {
   const pushEvent = event as ExtendableEvent & {
      oldSubscription?: PushSubscription;
      newSubscription?: PushSubscription;
   };

   pushEvent.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
         clients.forEach((client) => {
            client.postMessage({
               newSubscription: pushEvent.newSubscription?.toJSON(),
               oldSubscription: pushEvent.oldSubscription?.toJSON(),
               type: "PUSH_SUBSCRIPTION_CHANGE",
            });
         });
      }),
   );
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
   if (event.data?.type === "SKIP_WAITING") {
      self.skipWaiting();
   }

   if (event.data?.type === "GET_VERSION") {
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
   }

   if (event.data?.type === "CLEAR_CACHE") {
      event.waitUntil(
         caches.keys().then((cacheNames) => {
            return Promise.all(
               cacheNames.map((cacheName) => caches.delete(cacheName)),
            );
         }),
      );
   }
});

self.addEventListener("install", (event: ExtendableEvent) => {
   console.log("Service Worker installing...");
   event.waitUntil(
      caches.open(APP_SHELL_CACHE).then((cache) => {
         return cache.addAll(["/", "/offline.html", "/favicon.svg"]);
      }),
   );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
   console.log("Service Worker activating...");
   event.waitUntil(
      caches
         .keys()
         .then((cacheNames) => {
            return Promise.all(
               cacheNames
                  .filter((cacheName) => {
                     return (
                        (cacheName.startsWith("app-shell-") ||
                           cacheName.startsWith("static-") ||
                           cacheName.startsWith("dynamic-") ||
                           cacheName.startsWith("api-")) &&
                        !cacheName.includes(CACHE_VERSION)
                     );
                  })
                  .map((cacheName) => {
                     console.log("Deleting old cache:", cacheName);
                     return caches.delete(cacheName);
                  }),
            );
         })
         .then(() => self.clients.claim()),
   );
});

self.addEventListener("fetch", (event: FetchEvent) => {
   if (event.request.method !== "GET") return;

   if (event.request.mode === "navigate") {
      const url = new URL(event.request.url);

      if (
         url.pathname.startsWith("/share-target") ||
         url.pathname.startsWith("/file-handler")
      ) {
         event.respondWith(
            caches.match("/index.html").then((response) => {
               return response || fetch("/index.html");
            }),
         );
         return;
      }

      event.respondWith(
         fetch(event.request).catch(() => {
            return caches.match("/offline.html") as Promise<Response>;
         }),
      );
   }
});

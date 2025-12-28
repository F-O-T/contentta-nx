import { registerSW } from "virtual:pwa-register";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "@packages/localization";
import i18n from "@packages/localization";
import "@packages/ui/globals.css";

const intervalMS = 60 * 60 * 1000;

registerSW({
   immediate: true,
   onRegisteredSW(swUrl, registration) {
      if (registration) {
         setInterval(async () => {
            if (registration.installing || !navigator) return;
            if ("connection" in navigator && !navigator.onLine) return;

            const resp = await fetch(swUrl, {
               cache: "no-store",
               headers: {
                  cache: "no-store",
                  "cache-control": "no-cache",
               },
            });

            if (resp?.status === 200) {
               await registration.update();
            }
         }, intervalMS);
      }
   },
});

const router = createRouter({
   defaultPendingMs: 0,
   defaultPreload: "intent",
   defaultPreloadDelay: 0,
   defaultPreloadStaleTime: 0,
   defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
         let direction = "none";

         if (fromLocation) {
            const fromIndex = fromLocation.state.__TSR_index;
            const toIndex = toLocation.state.__TSR_index;
            direction = fromIndex > toIndex ? "right" : "left";
         }

         return [`slide-${direction}`];
      },
   },
   routeTree,
   scrollRestoration: true,
});

declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

function App() {
   useEffect(() => {
      document.documentElement.lang = i18n.language;
   }, []);
   return <RouterProvider router={router} />;
}

// biome-ignore lint/style/noNonNullAssertion: root element is always present
const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
   const root = ReactDOM.createRoot(rootElement);
   root.render(
      <React.StrictMode>
         <App />
      </React.StrictMode>,
   );
}

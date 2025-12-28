import {
   createTRPCClient,
   httpBatchLink,
   httpBatchStreamLink,
   httpSubscriptionLink,
   loggerLink,
   splitLink,
} from "@trpc/client";

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import SuperJSON from "superjson";
import urlJoin from "url-join";
import type { AppRouter } from "../server";

export interface APIClientOptions {
   serverUrl: string;

   headers?: Record<string, string> | Headers;
   language?: string;
   getOrganizationSlug?: () => string | undefined;
}

export const createTrpcClient = ({
   serverUrl,
   headers,
   language,
   getOrganizationSlug,
}: APIClientOptions) => {
   const isProduction =
      typeof process !== "undefined" && process.env.NODE_ENV === "production";

   return createTRPCClient<AppRouter>({
      links: [
         loggerLink({
            enabled: () => !isProduction,
         }),
         splitLink({
            // uses the httpSubscriptionLink for subscriptions
            condition: (op) => op.type === "subscription",
            false: splitLink({
               // Use streaming for operations that contain "stream" in the path
               condition: (op) => op.path.includes("stream"),
               false: httpBatchLink({
                  fetch(url, options) {
                     const requestHeaders = new Headers(options?.headers);

                     // Add language headers
                     const clientLanguage =
                        language ||
                        (typeof window !== "undefined"
                           ? document.documentElement.lang
                           : "en");
                     if (clientLanguage) {
                        requestHeaders.set("Accept-Language", clientLanguage);
                        requestHeaders.set("x-locale", clientLanguage);
                     }

                     // Add organization slug header
                     const organizationSlug = getOrganizationSlug?.();
                     if (organizationSlug) {
                        requestHeaders.set(
                           "x-organization-slug",
                           organizationSlug,
                        );
                     }

                     if (headers) {
                        const incomingHeaders = new Headers(headers as Headers);
                        const cookie = incomingHeaders.get("cookie");
                        if (cookie) {
                           requestHeaders.set("cookie", cookie);
                        }
                        const authorization =
                           incomingHeaders.get("authorization");
                        if (authorization) {
                           requestHeaders.set("authorization", authorization);
                        }
                     }
                     return fetch(url, {
                        ...options,
                        credentials: "include",
                        headers: requestHeaders,
                     });
                  },
                  transformer: SuperJSON,
                  url: urlJoin(serverUrl, "/trpc"),
               }),
               true: httpBatchStreamLink({
                  transformer: SuperJSON,
                  url: urlJoin(serverUrl, "/trpc"),
               }),
            }),
            true: httpSubscriptionLink({
               eventSourceOptions() {
                  return {
                     withCredentials: true,
                  };
               },
               transformer: SuperJSON,
               url: urlJoin(serverUrl, "/trpc"),
            }),
         }),
      ],
   });
};
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

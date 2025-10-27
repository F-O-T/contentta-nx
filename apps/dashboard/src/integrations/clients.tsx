import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { clientEnv } from "@packages/environment/client";
import { createAuthClient } from "@packages/authentication/client";
import { createTrpcClient } from "@packages/api/client";
import { getCurrentLanguage } from "@packages/localization";
import type { AppRouter } from "@packages/api/server";
import {
   createTRPCContext,
   createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { useState } from "react";

// This is now only for TRPC types and hooks
export const { TRPCProvider, useTRPC, useTRPCClient } =
   createTRPCContext<AppRouter>();

// This function now correctly uses the environment variable
export function makeTrpcClient(headers?: Headers) {
   return createTrpcClient({
      serverUrl: clientEnv.VITE_SERVER_URL,
      headers,
      language: getCurrentLanguage(),
   });
}

export const betterAuthClient = createAuthClient({
   apiBaseUrl: clientEnv.VITE_SERVER_URL,
});

export function makeQueryClient() {
   return new QueryClient({
      defaultOptions: {
         queries: {
            staleTime: 60 * 1000,
         },
      },
   });
}

// Client-side singleton for QueryClient
let browserQueryClient: QueryClient | undefined;
export function getQueryClient() {
   if (typeof window === "undefined") {
      return makeQueryClient();
   }
   if (!browserQueryClient) browserQueryClient = makeQueryClient();
   return browserQueryClient;
}

// Client-side singleton for tRPC Proxy. Do NOT use this on the server.
export const trpc = createTRPCOptionsProxy<AppRouter>({
   client: makeTrpcClient(),
   queryClient: getQueryClient(),
});

// This provider is now for CLIENT-SIDE use only
export function QueryProvider({ children }: { children: React.ReactNode }) {
   const queryClient = getQueryClient();
   const [trpcClient] = useState(() => makeTrpcClient());
   return (
      <QueryClientProvider client={queryClient}>
         <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <ReactQueryDevtools buttonPosition="top-left" />
            {children}
         </TRPCProvider>
      </QueryClientProvider>
   );
}
export type Session = typeof betterAuthClient.$Infer.Session;
export type TrpcClient = ReturnType<typeof createTRPCOptionsProxy<AppRouter>>;
export type InternalTrpcClient = ReturnType<typeof makeTrpcClient>;

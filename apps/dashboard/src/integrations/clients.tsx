import { createTrpcClient } from "@packages/api/client";
import type { AppRouter } from "@packages/api/server";
import {
   type AuthClientError,
   createAuthClient,
} from "@packages/authentication/client";
import { clientEnv } from "@packages/environment/client";
import { getCurrentLanguage } from "@packages/localization";
import { captureClientEvent } from "@packages/posthog/client";
import {
   MutationCache,
   QueryClient,
   QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TRPCClientError } from "@trpc/client";
import {
   createTRPCContext,
   createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { createElement, useState } from "react";
import { toast } from "sonner";
import { ErrorReportCredenza } from "@/features/error-report/ui/error-report-credenza";
import { openCredenza } from "@/hooks/use-credenza";

// This is now only for TRPC types and hooks
export const { TRPCProvider, useTRPC, useTRPCClient } =
   createTRPCContext<AppRouter>();

export const reservedRoutes = ["auth", "home", "api"];

function getOrganizationSlugFromUrl(): string | undefined {
   if (typeof window === "undefined") return undefined;
   const pathSegments = window.location.pathname.split("/").filter(Boolean);
   const firstSegment = pathSegments[0];
   if (!firstSegment) return undefined;
   if (reservedRoutes.includes(firstSegment)) return undefined;
   return firstSegment;
}

// This function now correctly uses the environment variable
export function makeTrpcClient(headers?: Headers) {
   return createTrpcClient({
      getOrganizationSlug: getOrganizationSlugFromUrl,
      headers,
      language: getCurrentLanguage(),
      serverUrl: clientEnv.VITE_SERVER_URL,
   });
}

const ERROR_THRESHOLD = 3;
const ERROR_WINDOW_MS = 60 * 1000;

type ErrorEntry = {
   count: number;
   firstOccurrence: number;
};

const errorTracker = new Map<string, ErrorEntry>();

function getErrorKey(path: string, code: string): string {
   return `${path}:${code}`;
}

function shouldShowErrorModal(path: string, code: string): boolean {
   const key = getErrorKey(path, code);
   const now = Date.now();
   const entry = errorTracker.get(key);

   if (!entry || now - entry.firstOccurrence > ERROR_WINDOW_MS) {
      errorTracker.set(key, { count: 1, firstOccurrence: now });
      return false;
   }

   entry.count += 1;

   if (entry.count >= ERROR_THRESHOLD) {
      errorTracker.delete(key);
      return true;
   }

   return false;
}

interface ErrorDetails {
   errorId: string;
   path: string;
   code: string;
   message: string;
}

function showErrorToast(error: ErrorDetails) {
   toast.error(error.message, {
      description: `${error.path} (${error.code})`,
   });
}

function showErrorModal(error: ErrorDetails) {
   openCredenza({
      children: createElement(ErrorReportCredenza, { error }),
   });
}

function handleError(
   error: ErrorDetails,
   eventName: string,
   extraProps?: Record<string, unknown>,
) {
   captureClientEvent(eventName, {
      code: error.code,
      errorId: error.errorId,
      message: error.message,
      path: error.path,
      ...extraProps,
   });

   if (shouldShowErrorModal(error.path, error.code)) {
      showErrorModal(error);
   } else {
      showErrorToast(error);
   }
}

function handleTrpcError(error: unknown) {
   if (error instanceof TRPCClientError) {
      const errorId =
         (error.meta?.responseHeaders as Headers | undefined)?.get(
            "x-error-id",
         ) || crypto.randomUUID();
      const path = error.data?.path || "unknown";
      const code = error.data?.code || "INTERNAL_SERVER_ERROR";
      const message = error.message;

      handleError({ code, errorId, message, path }, "trpc_client_error");
   }
}

function handleAuthError(error: AuthClientError) {
   const errorId = crypto.randomUUID();
   const path = "auth";
   const code = `HTTP_${error.status}`;
   const message = error.message || error.statusText;

   handleError({ code, errorId, message, path }, "auth_client_error", {
      status: error.status,
   });
}

export function makeQueryClient() {
   const queryClient: QueryClient = new QueryClient({
      defaultOptions: {
         queries: {
            staleTime: 60 * 1000,
         },
      },
      mutationCache: new MutationCache({
         onError: (error) => {
            handleTrpcError(error);
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               predicate: (query) =>
                  query.meta?.skipGlobalInvalidation !== true,
            });
         },
      }),
   });
   return queryClient;
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

export const betterAuthClient = createAuthClient({
   apiBaseUrl: clientEnv.VITE_SERVER_URL,
   onError: handleAuthError,
   onSuccess: () => {
      getQueryClient().invalidateQueries({
         predicate: (query) => query.meta?.skipGlobalInvalidation !== true,
      });
   },
});

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
         <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
            <ReactQueryDevtools buttonPosition="bottom-left" />
            {children}
         </TRPCProvider>
      </QueryClientProvider>
   );
}
export type Session = typeof betterAuthClient.$Infer.Session;
export type TrpcClient = ReturnType<typeof createTRPCOptionsProxy<AppRouter>>;
export type InternalTrpcClient = ReturnType<typeof makeTrpcClient>;

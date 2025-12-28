import { stripeClient } from "@better-auth/stripe/client";
import {
   adminClient,
   anonymousClient,
   apiKeyClient,
   emailOTPClient,
   inferAdditionalFields,
   lastLoginMethodClient,
   magicLinkClient,
   organizationClient,
   twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";
import type { AuthInstance } from "./server";

export interface AuthClientError {
   status: number;
   statusText: string;
   message?: string;
}

export interface AuthClientOptions {
   apiBaseUrl: string;
   onSuccess?: () => void;
   onError?: (error: AuthClientError) => void;
}

export const createAuthClient = ({
   apiBaseUrl,
   onSuccess,
   onError,
}: AuthClientOptions) =>
   createBetterAuthClient({
      baseURL: apiBaseUrl,

      fetchOptions: {
         onError: (context) => {
            onError?.({
               message: context.error?.message,
               status: context.response.status,
               statusText: context.response.statusText,
            });
         },
         onSuccess: () => {
            onSuccess?.();
         },
      },
      plugins: [
         inferAdditionalFields<AuthInstance>(),
         stripeClient({
            subscription: true,
         }),
         anonymousClient(),
         magicLinkClient(),
         emailOTPClient(),
         adminClient(),
         organizationClient({
            teams: {
               enabled: true,
            },
         }),
         twoFactorClient(),
         lastLoginMethodClient(),
         apiKeyClient(),
      ],
   });

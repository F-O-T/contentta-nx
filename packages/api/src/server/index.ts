import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { StripeClient } from "@packages/stripe";
import type { ResendClient } from "@packages/transactional/client";
import type { PostHog } from "posthog-node";
import { accountRouter } from "./routers/account";
import { accountDeletionRouter } from "./routers/account-deletion";
import { agentRouter } from "./routers/agent";
import { billingRouter } from "./routers/billing";
import { contentRouter } from "./routers/content";
import { encryptionRouter } from "./routers/encryption";
import { notificationRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { organizationRouter } from "./routers/organization";
import { organizationInvitesRouter } from "./routers/organization-invites";
import { organizationTeamsRouter } from "./routers/organization-teams";
import { permissionsRouter } from "./routers/permissions";
import { pushNotificationRouter } from "./routers/push-notifications";
import { sessionRouter } from "./routers/session";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";

export const appRouter = router({
   account: accountRouter,
   accountDeletion: accountDeletionRouter,
   agent: agentRouter,
   billing: billingRouter,
   content: contentRouter,
   encryption: encryptionRouter,
   notifications: notificationRouter,
   onboarding: onboardingRouter,
   organization: organizationRouter,
   organizationInvites: organizationInvitesRouter,
   organizationTeams: organizationTeamsRouter,
   permissions: permissionsRouter,
   pushNotifications: pushNotificationRouter,
   session: sessionRouter,
});

export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
   posthog,
   resendClient,
   stripeClient,
}: {
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   posthog: PostHog;
   resendClient?: ResendClient;
   stripeClient?: StripeClient;
}) => {
   return {
      createTRPCContext: async ({
         request,
         responseHeaders,
      }: {
         request: Request;
         responseHeaders: Headers;
      }) =>
         await createTRPCContextInternal({
            auth,
            db,
            minioBucket,
            minioClient,
            posthog,
            request,
            resendClient,
            responseHeaders,
            stripeClient,
         }),
      trpcRouter: appRouter,
   };
};

export type AppRouter = typeof appRouter;

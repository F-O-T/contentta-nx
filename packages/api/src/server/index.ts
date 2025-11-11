import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { PgVectorDatabaseInstance } from "@packages/rag/client";
import type { Polar } from "@polar-sh/sdk";
import { agentRouter } from "./router/agent";
import { agentFileRouter } from "./router/agent-file";
import { assistantRouter } from "./router/assistant";
import { authHelpersRouter } from "./router/auth-helpers";
import { brandRouter } from "./router/brand";
import { brandFileRouter } from "./router/brand-file";
import { bugReportRouter } from "./router/bug-report";
import { competitorRouter } from "./router/competitor";
import { competitorFileRouter } from "./router/competitor-file";
import { contentRouter } from "./router/content";
import { ideasRouter } from "./router/ideas";
import { organizationRouter } from "./router/organization";
import { organizationInvitesRouter } from "./router/organization-invites";
import { preferencesRouter } from "./router/preferences";
import { sessionRouter } from "./router/session";
import { statisticsRouter } from "./router/statistics";
import { subscriptionRouter } from "./router/subscription";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";

export const appRouter = router({
   agent: agentRouter,
   agentFile: agentFileRouter,
   assistant: assistantRouter,
   authHelpers: authHelpersRouter,
   brand: brandRouter,
   brandFile: brandFileRouter,
   bugReport: bugReportRouter,
   competitor: competitorRouter,
   competitorFile: competitorFileRouter,
   content: contentRouter,
   ideas: ideasRouter,
   organization: organizationRouter,
   organizationInvites: organizationInvitesRouter,
   preferences: preferencesRouter,
   session: sessionRouter,
   statistics: statisticsRouter,
   subscription: subscriptionRouter,
});
export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
   ragClient,
   polarClient,
}: {
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   ragClient: PgVectorDatabaseInstance;
   polarClient: Polar;
}) => {
   return {
      createTRPCContext: async ({ headers }: { headers: Headers }) =>
         await createTRPCContextInternal({
            auth,
            db,
            headers,
            minioBucket,
            minioClient,
            polarClient,
            ragClient,
         }),
      trpcRouter: appRouter,
   };
};

export type AppRouter = typeof appRouter;

import type { AuthInstance } from "@packages/authentication/server";
import type { Polar } from "@polar-sh/sdk";
import type { DatabaseInstance } from "@packages/database/client";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { agentFileRouter } from "./router/agent-file";
import type { MinioClient } from "@packages/files/client";
import type { PgVectorDatabaseInstance } from "@packages/rag/client";
import { agentRouter } from "./router/agent";
import { contentRouter } from "./router/content";
import { statisticsRouter } from "./router/statistics";
import { authHelpersRouter } from "./router/auth-helpers";
import { ideasRouter } from "./router/ideas";
import { preferencesRouter } from "./router/preferences";
import { competitorRouter } from "./router/competitor";
import { competitorFileRouter } from "./router/competitor-file";
import { bugReportRouter } from "./router/bug-report";
import { organizationRouter } from "./router/organization";
import { organizationFileRouter } from "./router/organization-file";
import { brandRouter } from "./router/brand";
import { brandFileRouter } from "./router/brand-file";
import { assistantRouter } from "./router/assistant";

export const appRouter = router({
   assistant: assistantRouter,
   agent: agentRouter,
   agentFile: agentFileRouter,
   content: contentRouter,
   authHelpers: authHelpersRouter,
   statistics: statisticsRouter,
   ideas: ideasRouter,
   preferences: preferencesRouter,
   competitor: competitorRouter,
   competitorFile: competitorFileRouter,
   bugReport: bugReportRouter,
   organization: organizationRouter,
   organizationFile: organizationFileRouter,
   brand: brandRouter,
   brandFile: brandFileRouter,
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
      trpcRouter: appRouter,
      createTRPCContext: async ({ headers }: { headers: Headers }) =>
         await createTRPCContextInternal({
            minioClient,
            auth,
            db,
            headers,
            minioBucket,
            ragClient,
            polarClient,
         }),
   };
};

export type AppRouter = typeof appRouter;

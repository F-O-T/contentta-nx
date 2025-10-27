import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { serverEnv as env } from "@packages/environment/server";
import { posthogPlugin } from "./integrations/posthog";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createApi } from "@packages/api/server";
import { auth, polarClient } from "./integrations/auth";
import { db, ragClient } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { sdkRoutes } from "./routes/sdk";
import { bullAuth } from "./integrations/bull-auth-guard";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { createBullBoard } from "@bull-board/api";
import { createNewContentWorkflowQueue } from "@packages/workers/queues/create-new-content-queue";
import { createOverviewQueue } from "@packages/workers/queues/create-overview-queue";
import { createFeaturesKnowledgeQueue } from "@packages/workers/queues/create-features-knowledge-queue";
import { createCompleteKnowledgeWorkflowQueue } from "@packages/workers/queues/create-complete-knowledge-workflow-queue";
import { createKnowledgeAndIndexDocumentsQueue } from "@packages/workers/queues/create-knowledge-and-index-documents-queue";
import { createCompetitorInsightsQueue } from "@packages/workers/queues/create-competitor-insights-queue";

import { isProduction } from "@packages/environment/helpers";
const serverAdapter = new ElysiaAdapter("/ui");

createBullBoard({
   queues: [
      new BullMQAdapter(createNewContentWorkflowQueue),
      new BullMQAdapter(createOverviewQueue),
      new BullMQAdapter(createFeaturesKnowledgeQueue),
      new BullMQAdapter(createCompleteKnowledgeWorkflowQueue),
      new BullMQAdapter(createKnowledgeAndIndexDocumentsQueue),
      new BullMQAdapter(createCompetitorInsightsQueue),
   ],
   serverAdapter,
   options: {
      uiBasePath: isProduction ? "node_modules/@bull-board/ui" : "",
   },
});
const trpcApi = createApi({
   polarClient,
   minioClient,
   minioBucket: env.MINIO_BUCKET,
   auth,
   db,
   ragClient,
});
const app = new Elysia({
   serve: {
      idleTimeout: 0,
   },
})
   .derive(() => ({
      db,
      ragClient,
      minioClient,
      minioBucket: env.MINIO_BUCKET,
      auth,
      polarClient,
   }))
   .use(
      cors({
         allowedHeaders: [
            "Content-Type",
            "Authorization",
            "sdk-api-key",
            "Accept-Language",
            "X-Locale",
         ],
         credentials: true,
         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         origin: (request: Request) => {
            const url = new URL(request.url);

            // Allow all origins for SDK endpoints
            if (url.pathname.startsWith("/sdk")) {
               return true;
            }

            // Use trusted origins for other endpoints
            const origin = request.headers.get("origin");
            const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS.split(",");
            return trustedOrigins.includes(origin || "");
         },
      }),
   )
   .use(posthogPlugin)
   .use(sdkRoutes)
   .mount(auth.handler)
   .all(
      "/trpc/*",
      async (opts) => {
         const res = await fetchRequestHandler({
            endpoint: "/trpc",
            router: trpcApi.trpcRouter,
            req: opts.request,
            createContext: async () =>
               await trpcApi.createTRPCContext({
                  headers: opts.request.headers,
               }),
         });

         return res;
      },
      {
         parse: "none",
      },
   )
   .onBeforeHandle(({ request }) => {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/ui")) {
         return bullAuth(request);
      }
   })
   .use(serverAdapter.registerPlugin())
   .listen(process.env.PORT ?? 9876);

console.log(
   `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app;

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import cors from "@elysiajs/cors";
import { createApi } from "@packages/api/server";
import { isProduction } from "@packages/environment/helpers";
import { serverEnv as env } from "@packages/environment/server";
import { createCompetitorInsightsQueue } from "@packages/workers/queues/create-competitor-insights-queue";
import { createCompleteKnowledgeWorkflowQueue } from "@packages/workers/queues/create-complete-knowledge-workflow-queue";
import { createNewContentWorkflowQueue } from "@packages/workers/queues/create-new-content-queue";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { auth, polarClient } from "./integrations/auth";
import { bullAuth } from "./integrations/bull-auth-guard";
import { db, ragClient } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { posthogPlugin } from "./integrations/posthog";
import { sdkRoutes } from "./routes/sdk";

const serverAdapter = new ElysiaAdapter("/ui");

createBullBoard({
   options: {
      uiBasePath: isProduction ? "node_modules/@bull-board/ui" : "",
   },
   queues: [
      new BullMQAdapter(createNewContentWorkflowQueue),
      new BullMQAdapter(createCompleteKnowledgeWorkflowQueue),
      new BullMQAdapter(createCompetitorInsightsQueue),
   ],
   serverAdapter,
});
const trpcApi = createApi({
   auth,
   db,
   minioBucket: env.MINIO_BUCKET,
   minioClient,
   polarClient,
   ragClient,
});
const app = new Elysia({
   serve: {
      idleTimeout: 0,
   },
})
   .derive(() => ({
      auth,
      db,
      minioBucket: env.MINIO_BUCKET,
      minioClient,
      polarClient,
      ragClient,
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
            createContext: async () =>
               await trpcApi.createTRPCContext({
                  headers: opts.request.headers,
               }),
            endpoint: "/trpc",
            req: opts.request,
            router: trpcApi.trpcRouter,
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

import cors from "@elysiajs/cors";
import { createApi } from "@packages/api/server";
import { createRedisConnection } from "@packages/cache/connection";
import { serverEnv as env } from "@packages/environment/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { auth, resendClient, stripeClient } from "./integrations/auth";
import { db, ragClient } from "./integrations/database";
import { registryRoutes } from "./routes/registry";
import { sdkRoutes } from "./routes/sdk";
import { logger } from "./integrations/logging";
import { minioClient } from "./integrations/minio";
import { posthog, posthogPlugin } from "./integrations/posthog";

const redisConnection = createRedisConnection(env.REDIS_URL);

const trpcApi = createApi({
   auth,
   db,
   minioBucket: env.MINIO_BUCKET,
   minioClient,
   posthog,
   resendClient,
   stripeClient,
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
            "X-Organization-Slug",
            "user-agent",
         ],
         credentials: true,
         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         origin: (request: Request) => {
            const url = new URL(request.url);

            if (url.pathname.startsWith("/sdk")) {
               return true;
            }

            const origin = request.headers.get("origin");
            const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS.split(",");
            return trustedOrigins.includes(origin || "");
         },
      }),
   )
   .use(posthogPlugin)
   .use(sdkRoutes)
   .use(registryRoutes)
   .mount(auth.handler)
   .all(
      "/trpc/*",
      async (opts) => {
         const responseHeaders = new Headers();

         const res = await fetchRequestHandler({
            createContext: async () =>
               await trpcApi.createTRPCContext({
                  request: opts.request,
                  responseHeaders,
               }),
            endpoint: "/trpc",
            req: opts.request,
            router: trpcApi.trpcRouter,
         });

         responseHeaders.forEach((value, key) => {
            res.headers.append(key, value);
         });

         return res;
      },
      {
         parse: "none",
      },
   )
   .get("/health", () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
   }))
   .get("/ready", async () => {
      const checks = { database: false, redis: false };

      try {
         await db.execute(sql`SELECT 1`);
         checks.database = true;
      } catch (error) {
         logger.error({ err: error }, "Database health check failed");
      }

      try {
         await redisConnection.ping();
         checks.redis = true;
      } catch (error) {
         logger.error({ err: error }, "Redis health check failed");
      }

      const healthy = Object.values(checks).every(Boolean);

      return {
         status: healthy ? "ready" : "degraded",
         checks,
         timestamp: new Date().toISOString(),
      };
   })
   .listen(process.env.PORT ?? 9876);

logger.info(
   { host: app.server?.hostname, port: app.server?.port },
   "Server started",
);
export type App = typeof app;

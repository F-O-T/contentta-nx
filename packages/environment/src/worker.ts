import { z } from "zod";
import { parseEnv } from "./helpers";

const EnvSchema = z.object({
   APP_URL: z.string().optional().default("https://app.montte.co"),
   BETTER_STACK_HEARTBEAT_URL: z.string().url().optional(),
   DATABASE_URL: z.string(),
   LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .optional()
      .default("info"),
   LOGTAIL_ENDPOINT: z.string().url().optional(),
   LOGTAIL_SOURCE_TOKEN: z.string().optional(),
   // Mastra workflow environment variables
   MASTRA_WORKER_CONCURRENCY: z.coerce.number().optional().default(2),
   MINIO_ACCESS_KEY: z.string().optional(),
   MINIO_BUCKET: z.string().optional().default("content-writer"),
   MINIO_ENDPOINT: z.string().optional(),
   MINIO_SECRET_KEY: z.string().optional(),
   OPENROUTER_API_KEY: z.string().optional(),
   PG_VECTOR_URL: z.string().optional(),
   REDIS_URL: z.string().optional().default("redis://localhost:6379"),
   RESEND_API_KEY: z.string(),
   TAVILY_API_KEY: z.string().optional(),
   VAPID_PRIVATE_KEY: z.string(),
   VAPID_PUBLIC_KEY: z.string(),
   VAPID_SUBJECT: z.string().optional().default("mailto:contato@montte.co"),
   WORKER_CONCURRENCY: z.coerce.number().optional().default(5),
});
export type WorkerEnv = z.infer<typeof EnvSchema>;
export const workerEnv: WorkerEnv = parseEnv(process.env, EnvSchema);

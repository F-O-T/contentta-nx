import { z } from "zod";
import { parseEnv } from "./helpers";

const EnvSchema = z.object({
   ARCJET_ENV: z.enum(["development", "production"]),
   ARCJET_KEY: z.string(),
   APP_URL: z.string().optional(),
   LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .optional()
      .default("info"),
   LOGTAIL_ENDPOINT: z.string().url().optional(),
   LOGTAIL_SOURCE_TOKEN: z.string().optional(),
   BETTER_AUTH_GOOGLE_CLIENT_ID: z.string(),
   BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string(),
   BETTER_AUTH_SECRET: z.string(),
   BETTER_AUTH_TRUSTED_ORIGINS: z.string(),
   DATABASE_URL: z.string(),
   PG_VECTOR_URL: z.string(),
   // Server-side encryption key (64-character hex string = 32 bytes)
   ENCRYPTION_KEY: z
      .string()
      .length(64, "ENCRYPTION_KEY must be a 64-character hex string")
      .regex(/^[0-9a-fA-F]+$/, "ENCRYPTION_KEY must be a valid hex string")
      .optional(),
   OPENAI_API_KEY: z.string(),
   OPENROUTER_API_KEY: z.string(),
   MINIO_ACCESS_KEY: z.string(),
   MINIO_BUCKET: z.string().default("content-writer"),
   MINIO_ENDPOINT: z.string(),
   MINIO_SECRET_KEY: z.string(),
   POSTHOG_HOST: z.string(),
   POSTHOG_KEY: z.string(),
   REDIS_URL: z.string().optional().default("redis://localhost:6379"),
   RESEND_API_KEY: z.string(),
   STRIPE_PRO_ANNUAL_PRICE_ID: z.string(),
   STRIPE_PRO_PRICE_ID: z.string(),
   STRIPE_SECRET_KEY: z.string(),
   STRIPE_WEBHOOK_SECRET: z.string(),
   // Search providers (comma-separated for multiple keys)
	TAVILY_API_KEY: z.string(), // Legacy single key (for backward compat)
	TAVILY_API_KEYS: z.string().optional(), // Multiple keys: key1,key2,key3
	EXA_API_KEYS: z.string().optional(),
	FIRECRAWL_API_KEYS: z.string().optional(),
   VAPID_PRIVATE_KEY: z.string().optional(),
   VAPID_PUBLIC_KEY: z.string().optional(),
   VAPID_SUBJECT: z.string().optional().default("mailto:contato@contentta.com"),
   WORKER_CONCURRENCY: z.coerce.number().optional().default(5),
});
export type ServerEnv = z.infer<typeof EnvSchema>;
export const serverEnv: ServerEnv = parseEnv(process.env, EnvSchema);

import type { Config } from "drizzle-kit";
import z from "zod";

const env = z
   .object({
      PG_VECTOR_URL: z.string(),
   })
   .parse(process.env);
export default {
   casing: "snake_case",
   dbCredentials: { url: env.PG_VECTOR_URL },
   dialect: "postgresql",
   schema: "./src/schema.ts",
} satisfies Config;

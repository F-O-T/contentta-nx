import type { Config } from "drizzle-kit";
import z from "zod";

const env = z
   .object({
      DATABASE_URL: z.string(),
   })
   .parse(process.env);

export default {
   casing: "snake_case",
   dbCredentials: { url: env.DATABASE_URL },
   dialect: "postgresql",
   schema: "./src/schema.ts",
} satisfies Config;

import { validateInput } from "@packages/utils/errors";
import type { ZodObject, z } from "zod";

export const isClientProduction = import.meta.env.PROD;
export const isProduction = process.env.NODE_ENV === "production";

export const getDomain = () => {
   if (process.env.APP_URL) {
      return process.env.APP_URL;
   }
   if (isProduction) {
      return "https://app.montte.co";
   }

   return "http://localhost:3000";
};

export function parseEnv<T extends ZodObject>(
   env: NodeJS.ProcessEnv,
   schema: T,
): z.infer<T> {
   return validateInput(schema, env);
}

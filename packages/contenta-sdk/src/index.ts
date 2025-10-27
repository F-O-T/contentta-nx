import { createSdk } from "@contentagen/sdk";
import { serverEnv } from "@packages/environment/server";
import { isProduction } from "@packages/environment/helpers";

export const createContentaSdk = (
   locale: Parameters<typeof createSdk>[0]["locale"],
) =>
   createSdk({
      apiKey: serverEnv.CONTENTAGEN_API_KEY,
      host: isProduction
         ? "https://api.contentagen.com"
         : "http://localhost:9876",
      locale,
   });

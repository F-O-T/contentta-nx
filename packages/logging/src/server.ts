import { createSafeLogger } from "./logger";
import type { Logger, LogLevel } from "./types";

let serverLogger: Logger | null = null;

export interface ServerLoggerEnv {
   LOGTAIL_ENDPOINT?: string;
   LOGTAIL_SOURCE_TOKEN?: string;
   LOG_LEVEL?: LogLevel;
}

export function getServerLogger(env: ServerLoggerEnv): Logger {
   if (!serverLogger) {
      serverLogger = createSafeLogger({
         name: "finance-tracker-server",
         logtailToken: env.LOGTAIL_SOURCE_TOKEN,
         logtailEndpoint: env.LOGTAIL_ENDPOINT,
         level: env.LOG_LEVEL || "info",
      });
   }
   return serverLogger;
}

export function resetServerLogger(): void {
   serverLogger = null;
}

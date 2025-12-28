import { createSafeLogger } from "./logger";
import type { Logger, LogLevel } from "./types";

let workerLogger: Logger | null = null;

export interface WorkerLoggerEnv {
   LOGTAIL_ENDPOINT?: string;
   LOGTAIL_SOURCE_TOKEN?: string;
   BETTER_STACK_HEARTBEAT_URL?: string;
   LOG_LEVEL?: LogLevel;
}

export function getWorkerLogger(env: WorkerLoggerEnv): Logger {
   if (!workerLogger) {
      workerLogger = createSafeLogger({
         name: "finance-tracker-worker",
         logtailToken: env.LOGTAIL_SOURCE_TOKEN,
         logtailEndpoint: env.LOGTAIL_ENDPOINT,
         level: env.LOG_LEVEL || "info",
      });
   }
   return workerLogger;
}

export function resetWorkerLogger(): void {
   workerLogger = null;
}

export async function sendHeartbeat(
   heartbeatUrl: string | undefined,
): Promise<void> {
   if (!heartbeatUrl) return;

   try {
      await fetch(heartbeatUrl, { method: "GET" });
   } catch {
      // Silently fail - heartbeat is non-critical
   }
}

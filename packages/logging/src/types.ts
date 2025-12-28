import type { Logger } from "pino";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LoggerConfig {
   name: string;
   level?: LogLevel;
   logtailToken?: string;
   logtailEndpoint?: string;
}

export type { Logger };

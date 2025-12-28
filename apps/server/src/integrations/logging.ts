import { serverEnv } from "@packages/environment/server";
import { getServerLogger } from "@packages/logging/server";

export const logger = getServerLogger(serverEnv);

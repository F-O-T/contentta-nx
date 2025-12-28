import { serverEnv as env } from "@packages/environment/server";
import { getMinioClient } from "@packages/files/client";

export const minioClient = getMinioClient(env);

import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";

export type CreateFeaturesKnowledgeJob = {
   id: string;
   userId: string;
   websiteUrl: string;
   target: "brand" | "competitor";
   runtimeContext?: CustomRuntimeContext;
};

const QUEUE = "create-features-knowledge";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createFeaturesKnowledgeQueue =
   new Queue<CreateFeaturesKnowledgeJob>(QUEUE, {
      connection: redis,
   });
registerGracefulShutdown(createFeaturesKnowledgeQueue);

export async function enqueueCreateFeaturesKnowledgeJob(
   job: CreateFeaturesKnowledgeJob,
) {
   return createFeaturesKnowledgeQueue.add(QUEUE, job);
}

export const createFeaturesKnowledgeWorker =
   new Worker<CreateFeaturesKnowledgeJob>(
      QUEUE,
      async (job: Job<CreateFeaturesKnowledgeJob>) => {
         const { id, userId, websiteUrl, target, runtimeContext } = job.data;

         try {
            // Restore runtime context if it exists
            const run = await mastra
               .getWorkflow("createFeaturesKnowledgeWorkflow")
               .createRunAsync();

            const result = await run.start({
               runtimeContext: setRuntimeContext({
                  language: runtimeContext?.language ?? "en",
                  userId,
               }),

               inputData: {
                  websiteUrl,
                  userId,
                  id,
                  target,
               },
            });

            return {
               userId,
               id,
               websiteUrl,
               target,
               result,
            };
         } catch (error) {
            console.error("[CreateFeaturesKnowledge] WORKFLOW ERROR", {
               id,
               userId,
               websiteUrl,
               target,
               error: error instanceof Error ? error.message : error,
               stack:
                  error instanceof Error && error.stack
                     ? error.stack
                     : undefined,
            });
            propagateError(error);
            throw AppError.internal(
               `Create features knowledge workflow failed: ${(error as Error).message}`,
            );
         }
      },

      { connection: redis, removeOnComplete: { count: 10 } },
   );
registerGracefulShutdown(createFeaturesKnowledgeWorker);

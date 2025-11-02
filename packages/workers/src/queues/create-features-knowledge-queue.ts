import {
   type CustomRuntimeContext,
   mastra,
   setRuntimeContext,
} from "@packages/agents";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import { type Job, Queue, Worker } from "bullmq";
import { createRedisClient, registerGracefulShutdown } from "../helpers";

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
               inputData: {
                  id,
                  target,
                  userId,
                  websiteUrl,
               },
               runtimeContext: setRuntimeContext({
                  language: runtimeContext?.language,
                  userId,
               }),
            });

            return {
               id,
               result,
               target,
               userId,
               websiteUrl,
            };
         } catch (error) {
            console.error("[CreateFeaturesKnowledge] WORKFLOW ERROR", {
               error: error instanceof Error ? error.message : error,
               id,
               stack:
                  error instanceof Error && error.stack
                     ? error.stack
                     : undefined,
               target,
               userId,
               websiteUrl,
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

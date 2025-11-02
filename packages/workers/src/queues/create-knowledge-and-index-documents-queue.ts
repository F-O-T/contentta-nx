import {
   type CustomRuntimeContext,
   mastra,
   setRuntimeContext,
} from "@packages/agents";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import { type Job, Queue, Worker } from "bullmq";
import { createRedisClient, registerGracefulShutdown } from "../helpers";

export type CreateKnowledgeAndIndexDocumentsJob = {
   id: string;
   userId: string;
   websiteUrl: string;
   target: "brand" | "competitor";
   runtimeContext?: CustomRuntimeContext;
};

const QUEUE = "create-knowledge-and-index-documents";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createKnowledgeAndIndexDocumentsQueue =
   new Queue<CreateKnowledgeAndIndexDocumentsJob>(QUEUE, {
      connection: redis,
   });
registerGracefulShutdown(createKnowledgeAndIndexDocumentsQueue);

export async function enqueueCreateKnowledgeAndIndexDocumentsJob(
   job: CreateKnowledgeAndIndexDocumentsJob,
) {
   return createKnowledgeAndIndexDocumentsQueue.add(QUEUE, job);
}

export const createKnowledgeAndIndexDocumentsWorker =
   new Worker<CreateKnowledgeAndIndexDocumentsJob>(
      QUEUE,
      async (job: Job<CreateKnowledgeAndIndexDocumentsJob>) => {
         const { id, userId, websiteUrl, target, runtimeContext } = job.data;

         try {
            // Restore runtime context if it exists
            const run = await mastra
               .getWorkflow("createKnowledgeAndIndexDocumentsWorkflow")
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
            console.error("[CreateKnowledgeAndIndexDocuments] WORKFLOW ERROR", {
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
               `Create knowledge and index documents workflow failed: ${(error as Error).message}`,
            );
         }
      },
      { connection: redis, removeOnComplete: { count: 10 } },
   );
registerGracefulShutdown(createKnowledgeAndIndexDocumentsWorker);

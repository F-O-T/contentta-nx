import {
   type CustomRuntimeContext,
   mastra,
   setRuntimeContext,
} from "@packages/agents";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import { type Job, Queue, Worker } from "bullmq";
import { createRedisClient, registerGracefulShutdown } from "../helpers";

export interface CreateCompleteKnowledgeWorkflowJobData {
   websiteUrl: string;
   userId: string;
   id: string;
   target: "brand" | "competitor";
   runtimeContext?: CustomRuntimeContext;
}

export async function runCreateCompleteKnowledgeWorkflow(
   payload: CreateCompleteKnowledgeWorkflowJobData,
) {
   const { websiteUrl, userId, id, target, runtimeContext } = payload;

   // Restore runtime context if it exists

   try {
      const run = await mastra
         .getWorkflow("createCompleteKnowledgeWorkflow")
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
      console.error("[CreateCompleteKnowledgeWorkflow] WORKFLOW ERROR", {
         error: error instanceof Error ? error.message : error,
         id,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
         target,
         userId,
         websiteUrl,
      });
      propagateError(error);
      throw AppError.internal(
         `Complete knowledge workflow failed: ${(error as Error).message}`,
      );
   }
}

const QUEUE_NAME = "create-complete-knowledge-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createCompleteKnowledgeWorkflowQueue =
   new Queue<CreateCompleteKnowledgeWorkflowJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createCompleteKnowledgeWorkflowQueue);

export async function enqueueCreateCompleteKnowledgeWorkflowJob(
   data: CreateCompleteKnowledgeWorkflowJobData,
   jobOptions?: Parameters<
      Queue<CreateCompleteKnowledgeWorkflowJobData>["add"]
   >[2],
) {
   return createCompleteKnowledgeWorkflowQueue.add(
      QUEUE_NAME,
      data,
      jobOptions,
   );
}

export const createCompleteKnowledgeWorkflowWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateCompleteKnowledgeWorkflowJobData>) => {
      await runCreateCompleteKnowledgeWorkflow(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createCompleteKnowledgeWorkflowWorker);

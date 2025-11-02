import {
   type CustomRuntimeContext,
   mastra,
   setRuntimeContext,
} from "@packages/agents";
import type { ContentRequest } from "@packages/database/schemas/content";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import { type Job, Queue, Worker } from "bullmq";
import { createRedisClient, registerGracefulShutdown } from "../helpers";

export type CreateNewContentWorkflowJobData = {
   userId: string;
   competitorIds: string[];
   contentId: string;
   organizationId: string;
   agentId: string;
   request: ContentRequest;
   runtimeContext?: CustomRuntimeContext;
};
export async function runCreateNewContentWorkflow(
   payload: CreateNewContentWorkflowJobData,
) {
   const {
      userId,
      competitorIds,
      agentId,
      organizationId,
      request,
      runtimeContext,
      contentId,
   } = payload;

   try {
      const run = await mastra
         .getWorkflow("createNewContentWorkflow")
         .createRunAsync();

      const result = await run.start({
         inputData: {
            agentId,
            competitorIds,
            contentId,
            organizationId,
            request,
            userId,
         },
         runtimeContext: setRuntimeContext({
            agentId,
            language: runtimeContext?.language,
            userId,
         }),
      });

      return {
         result,
         userId,
      };
   } catch (error) {
      console.error("[CreateNewContentWorkflow] WORKFLOW ERROR", {
         contentId,
         error: error instanceof Error ? error.message : error,
         request,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
         userId,
      });
      propagateError(error);
      throw AppError.internal(
         `Create new content workflow failed: ${(error as Error).message}`,
      );
   }
}

const QUEUE_NAME = "create-new-content-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createNewContentWorkflowQueue =
   new Queue<CreateNewContentWorkflowJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createNewContentWorkflowQueue);

export async function enqueueCreateNewContentWorkflowJob(
   data: CreateNewContentWorkflowJobData,
   jobOptions?: Parameters<Queue<CreateNewContentWorkflowJobData>["add"]>[2],
) {
   return createNewContentWorkflowQueue.add(QUEUE_NAME, data, jobOptions);
}

export const createNewContentWorkflowWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateNewContentWorkflowJobData>) => {
      await runCreateNewContentWorkflow(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createNewContentWorkflowWorker);

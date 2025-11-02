import {
   type CustomRuntimeContext,
   mastra,
   setRuntimeContext,
} from "@packages/agents";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import { type Job, Queue, Worker } from "bullmq";
import { createRedisClient, registerGracefulShutdown } from "../helpers";

export type CreateOverviewJob = {
   id: string;
   userId: string;
   websiteUrl: string;
   target: "brand" | "competitor";
   runtimeContext?: CustomRuntimeContext;
};

const QUEUE = "create-overview";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createOverviewQueue = new Queue<CreateOverviewJob>(QUEUE, {
   connection: redis,
});
registerGracefulShutdown(createOverviewQueue);

export async function enqueueCreateOverviewJob(job: CreateOverviewJob) {
   return createOverviewQueue.add(QUEUE, job);
}

export const createOverviewWorker = new Worker<CreateOverviewJob>(
   QUEUE,
   async (job: Job<CreateOverviewJob>) => {
      const { id, userId, websiteUrl, target, runtimeContext } = job.data;

      try {
         // Restore runtime context if it exists
         const run = await mastra
            .getWorkflow("createOverviewWorkflow")
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
         console.error("[CreateOverview] WORKFLOW ERROR", {
            error: error instanceof Error ? error.message : error,
            id,
            stack:
               error instanceof Error && error.stack ? error.stack : undefined,
            target,
            userId,
            websiteUrl,
         });
         propagateError(error);
         throw AppError.internal(
            `Create overview workflow failed: ${(error as Error).message}`,
         );
      }
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(createOverviewWorker);

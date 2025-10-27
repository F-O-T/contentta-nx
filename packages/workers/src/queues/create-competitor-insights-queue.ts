import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";

export interface CreateCompetitorInsightsJobData {
   organizationId: string;
   userId: string;
   competitorId: string;
   runtimeContext?: CustomRuntimeContext;
}

export async function runCreateCompetitorInsightsWorkflow(
   payload: CreateCompetitorInsightsJobData,
) {
   const { organizationId, userId, competitorId, runtimeContext } = payload;

   try {
      const run = await mastra
         .getWorkflow("createCompetitorInsightsWorkflow")
         .createRunAsync();

      const result = await run.start({
         runtimeContext: setRuntimeContext({
            language: runtimeContext?.language ?? "en",
            userId,
            brandId: runtimeContext?.brandId,
         }),

         inputData: {
            organizationId,
            userId,
            competitorId,
         },
      });

      return {
         userId,
         organizationId,
         competitorId,
         result,
      };
   } catch (error) {
      console.error("[CreateCompetitorInsightsWorkflow] WORKFLOW ERROR", {
         organizationId,
         userId,
         competitorId,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      propagateError(error);
      throw AppError.internal(
         `Competitor insights workflow failed: ${(error as Error).message}`,
      );
   }
}

const QUEUE_NAME = "create-competitor-insights";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const createCompetitorInsightsQueue =
   new Queue<CreateCompetitorInsightsJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(createCompetitorInsightsQueue);

export async function enqueueCreateCompetitorInsightsJob(
   data: CreateCompetitorInsightsJobData,
   jobOptions?: Parameters<Queue<CreateCompetitorInsightsJobData>["add"]>[2],
) {
   return createCompetitorInsightsQueue.add(QUEUE_NAME, data, jobOptions);
}

export const createCompetitorInsightsWorker = new Worker(
   QUEUE_NAME,
   async (job: Job<CreateCompetitorInsightsJobData>) => {
      await runCreateCompetitorInsightsWorkflow(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(createCompetitorInsightsWorker);

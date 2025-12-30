import { createDb } from "@packages/database/client";
import { workerEnv as env } from "@packages/environment/worker";
import { getWorkerLogger, sendHeartbeat } from "@packages/logging/worker";
import type { Job } from "@packages/queue/bullmq";
import {
   closeRedisConnection,
   createRedisConnection,
} from "@packages/queue/connection";
import { getResendClient } from "@packages/transactional/utils";
import { createWorkflowWorker } from "@packages/workflows/queue/consumer";
import { createDeletionWorker } from "@packages/workflows/queue/deletion-consumer";
import { createMaintenanceWorker } from "@packages/workflows/queue/maintenance-consumer";
import { initializeWorkflowQueue } from "@packages/workflows/queue/producer";
import {
   closeDeletionQueue,
   closeMaintenanceQueue,
   createDeletionQueue,
   createMaintenanceQueue,
   type DeletionJobData,
   type DeletionJobResult,
   type MaintenanceJobData,
   type MaintenanceJobResult,
   type WorkflowJobData,
   type WorkflowJobResult,
} from "@packages/workflows/queue/queues";

const logger = getWorkerLogger(env);

const MEMORY_THRESHOLD_MB = 512;
const HEALTH_CHECK_INTERVAL_MS = 180000; // 3 minutes

const db = createDb({ databaseUrl: env.DATABASE_URL });

const redisConnection = createRedisConnection(env.REDIS_URL);

const resendClient = env.RESEND_API_KEY
   ? getResendClient(env.RESEND_API_KEY)
   : undefined;

const vapidConfig =
   env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY
      ? {
           privateKey: env.VAPID_PRIVATE_KEY,
           publicKey: env.VAPID_PUBLIC_KEY,
           subject: env.VAPID_SUBJECT ?? "mailto:contato@montte.co",
        }
      : undefined;

logger.info("Starting workflow worker");

let isShuttingDown = false;

initializeWorkflowQueue(redisConnection);

const maintenanceQueue = createMaintenanceQueue(redisConnection);

await maintenanceQueue.add(
   "cleanup-automation-logs",
   { type: "cleanup-automation-logs", retentionDays: 7 },
   {
      jobId: "cleanup-automation-logs-daily",
      repeat: { pattern: "0 0 * * *" },
   },
);

logger.info({ retentionDays: 7 }, "Scheduled daily automation log cleanup job");

const { worker: maintenanceWorker, close: closeMaintenanceWorker } =
   createMaintenanceWorker({
      concurrency: 1,
      connection: redisConnection,
      db,
      onCompleted: async (
         job: Job<MaintenanceJobData, MaintenanceJobResult>,
         result: MaintenanceJobResult,
      ) => {
         logger.info(
            { jobName: job.name, deletedCount: result.deletedCount },
            "Maintenance job completed",
         );
      },
      onFailed: async (
         job: Job<MaintenanceJobData, MaintenanceJobResult> | undefined,
         error: Error,
      ) => {
         logger.error(
            { jobName: job?.name, err: error },
            "Maintenance job failed",
         );
      },
   });

logger.info("Maintenance worker started");

// Deletion queue and worker
const deletionQueue = createDeletionQueue(redisConnection);

// Schedule deletion processing jobs
await deletionQueue.add(
   "process-deletions",
   { type: "process-deletions" },
   {
      jobId: "process-deletions-daily",
      repeat: { pattern: "0 2 * * *" }, // 2 AM daily
   },
);

await deletionQueue.add(
   "send-reminders",
   { type: "send-reminders" },
   {
      jobId: "send-reminders-daily",
      repeat: { pattern: "0 9 * * *" }, // 9 AM daily
   },
);

logger.info(
   { processTime: "2 AM", reminderTime: "9 AM" },
   "Scheduled daily account deletion jobs",
);

const { worker: deletionWorker, close: closeDeletionWorker } =
   createDeletionWorker({
      concurrency: 1,
      connection: redisConnection,
      db,
      resendClient,
      appUrl: env.APP_URL,
      onCompleted: async (
         job: Job<DeletionJobData, DeletionJobResult>,
         result: DeletionJobResult,
      ) => {
         logger.info(
            {
               jobName: job.name,
               processedCount: result.processedCount,
               emailsSent: result.emailsSent,
            },
            "Deletion job completed",
         );
      },
      onFailed: async (
         job: Job<DeletionJobData, DeletionJobResult> | undefined,
         error: Error,
      ) => {
         logger.error(
            { jobName: job?.name, err: error },
            "Deletion job failed",
         );
      },
   });

logger.info("Deletion worker started");

const { worker, close } = createWorkflowWorker({
   concurrency: env.WORKER_CONCURRENCY || 5,
   connection: redisConnection,
   db,
   resendClient,
   vapidConfig,
   onCompleted: async (
      job: Job<WorkflowJobData, WorkflowJobResult>,
      result: WorkflowJobResult,
   ) => {
      logger.info(
         {
            jobId: job.id,
            rulesMatched: result.rulesMatched,
            rulesEvaluated: result.rulesEvaluated,
         },
         "Workflow job completed",
      );

      if (global.gc) {
         global.gc();
      }
   },
   onFailed: async (
      job: Job<WorkflowJobData, WorkflowJobResult> | undefined,
      error: Error,
   ) => {
      logger.error({ jobId: job?.id, err: error }, "Workflow job failed");
   },
});

logger.info(
   { concurrency: env.WORKER_CONCURRENCY || 5 },
   "Workflow worker started",
);

worker.on("active", (job: Job<WorkflowJobData, WorkflowJobResult>) => {
   logger.debug(
      { jobId: job.id, eventType: job.data.event.type },
      "Job active",
   );
});

worker.on("stalled", (jobId: string) => {
   logger.warn({ jobId }, "Job stalled");
});

worker.on("error", (error: Error) => {
   logger.error({ err: error }, "Worker error");
});

async function gracefulShutdown(signal: string) {
   if (isShuttingDown) {
      logger.info("Shutdown already in progress");
      return;
   }

   isShuttingDown = true;
   logger.info(
      { signal },
      "Received shutdown signal, shutting down gracefully",
   );

   const shutdownTimeout = setTimeout(() => {
      logger.error("Shutdown timeout exceeded, forcing exit");
      process.exit(1);
   }, 30000);

   try {
      logger.info("Pausing workers to stop accepting new jobs");
      await worker.pause();
      await maintenanceWorker.pause();
      await deletionWorker.pause();

      logger.info("Waiting for active jobs to complete");
      await close();
      await closeMaintenanceWorker();
      await closeDeletionWorker();

      logger.info("Closing queues");
      await closeMaintenanceQueue();
      await closeDeletionQueue();

      logger.info("Closing Redis connection");
      await closeRedisConnection();

      clearTimeout(shutdownTimeout);
      logger.info("Worker shut down complete");
      process.exit(0);
   } catch (error) {
      clearTimeout(shutdownTimeout);
      logger.error({ err: error }, "Error during shutdown");
      process.exit(1);
   }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
   logger.error({ err: error }, "Uncaught exception");
   gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
   logger.error({ reason, promise }, "Unhandled rejection");
});

const healthCheckInterval = setInterval(async () => {
   if (isShuttingDown) {
      clearInterval(healthCheckInterval);
      return;
   }

   const memUsage = process.memoryUsage();
   const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
   const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
   const rssMB = Math.round(memUsage.rss / 1024 / 1024);

   logger.info({ heapUsedMB, heapTotalMB, rssMB }, "Health check");

   // Send heartbeat to Better Stack
   await sendHeartbeat(env.BETTER_STACK_HEARTBEAT_URL);

   if (heapUsedMB > MEMORY_THRESHOLD_MB) {
      logger.warn(
         { heapUsedMB, threshold: MEMORY_THRESHOLD_MB },
         "Memory warning: heap usage exceeds threshold",
      );

      if (global.gc) {
         logger.info("Triggering garbage collection");
         global.gc();
      }

      const afterGC = process.memoryUsage();
      const afterHeapMB = Math.round(afterGC.heapUsed / 1024 / 1024);

      if (afterHeapMB > MEMORY_THRESHOLD_MB * 1.5) {
         logger.error(
            { afterHeapMB, criticalThreshold: MEMORY_THRESHOLD_MB * 1.5 },
            "Memory critical: initiating graceful restart",
         );
         gracefulShutdown("MEMORY_PRESSURE");
      }
   }
}, HEALTH_CHECK_INTERVAL_MS);

import type { ConnectionOptions } from "@packages/queue/bullmq";
import { Queue } from "@packages/queue/bullmq";
import type { WorkflowEvent } from "../types/events";

export const WORKFLOW_QUEUE_NAME = "workflow-events";

export type WorkflowJobData = {
   event: WorkflowEvent;
   metadata?: {
      triggeredBy?: "event" | "manual";
      correlationId?: string;
   };
};

export type WorkflowJobResult = {
   eventId: string;
   rulesEvaluated: number;
   rulesMatched: number;
   success: boolean;
   error?: string;
};

let workflowQueue: Queue<WorkflowJobData, WorkflowJobResult> | null = null;

export function createWorkflowQueue(
   connection: ConnectionOptions,
): Queue<WorkflowJobData, WorkflowJobResult> {
   if (workflowQueue) {
      return workflowQueue;
   }

   workflowQueue = new Queue<WorkflowJobData, WorkflowJobResult>(
      WORKFLOW_QUEUE_NAME,
      {
         connection,
         defaultJobOptions: {
            attempts: 3,
            backoff: {
               delay: 1000,
               type: "exponential",
            },
            removeOnComplete: {
               age: 24 * 60 * 60,
               count: 1000,
            },
            removeOnFail: {
               age: 7 * 24 * 60 * 60,
            },
         },
      },
   );

   return workflowQueue;
}

export function getWorkflowQueue(): Queue<
   WorkflowJobData,
   WorkflowJobResult
> | null {
   return workflowQueue;
}

export async function closeWorkflowQueue(): Promise<void> {
   if (workflowQueue) {
      await workflowQueue.close();
      workflowQueue = null;
   }
}

export const MAINTENANCE_QUEUE_NAME = "maintenance";

export type MaintenanceJobType = "cleanup-automation-logs";

export type MaintenanceJobData = {
   type: MaintenanceJobType;
   retentionDays?: number;
};

export type MaintenanceJobResult = {
   deletedCount: number;
   success: boolean;
   error?: string;
};

let maintenanceQueue: Queue<MaintenanceJobData, MaintenanceJobResult> | null =
   null;

export function createMaintenanceQueue(
   connection: ConnectionOptions,
): Queue<MaintenanceJobData, MaintenanceJobResult> {
   if (maintenanceQueue) {
      return maintenanceQueue;
   }

   maintenanceQueue = new Queue<MaintenanceJobData, MaintenanceJobResult>(
      MAINTENANCE_QUEUE_NAME,
      {
         connection,
         defaultJobOptions: {
            attempts: 3,
            backoff: {
               delay: 5000,
               type: "exponential",
            },
            removeOnComplete: {
               age: 7 * 24 * 60 * 60,
               count: 100,
            },
            removeOnFail: {
               age: 14 * 24 * 60 * 60,
            },
         },
      },
   );

   return maintenanceQueue;
}

export function getMaintenanceQueue(): Queue<
   MaintenanceJobData,
   MaintenanceJobResult
> | null {
   return maintenanceQueue;
}

export async function closeMaintenanceQueue(): Promise<void> {
   if (maintenanceQueue) {
      await maintenanceQueue.close();
      maintenanceQueue = null;
   }
}

// Account Deletion Queue

export const DELETION_QUEUE_NAME = "account-deletion";

export type DeletionJobType = "process-deletions" | "send-reminders";

export type DeletionJobData = {
   type: DeletionJobType;
};

export type DeletionJobResult = {
   processedCount: number;
   emailsSent: number;
   success: boolean;
   error?: string;
};

let deletionQueue: Queue<DeletionJobData, DeletionJobResult> | null = null;

export function createDeletionQueue(
   connection: ConnectionOptions,
): Queue<DeletionJobData, DeletionJobResult> {
   if (deletionQueue) {
      return deletionQueue;
   }

   deletionQueue = new Queue<DeletionJobData, DeletionJobResult>(
      DELETION_QUEUE_NAME,
      {
         connection,
         defaultJobOptions: {
            attempts: 3,
            backoff: {
               delay: 5000,
               type: "exponential",
            },
            removeOnComplete: {
               age: 7 * 24 * 60 * 60,
               count: 100,
            },
            removeOnFail: {
               age: 14 * 24 * 60 * 60,
            },
         },
      },
   );

   return deletionQueue;
}

export function getDeletionQueue(): Queue<
   DeletionJobData,
   DeletionJobResult
> | null {
   return deletionQueue;
}

export async function closeDeletionQueue(): Promise<void> {
   if (deletionQueue) {
      await deletionQueue.close();
      deletionQueue = null;
   }
}

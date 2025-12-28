import type { ConnectionOptions } from "@packages/queue/bullmq";
import type { WorkflowEvent } from "../types/events";
import {
   createWorkflowQueue,
   getWorkflowQueue,
   type WorkflowJobData,
} from "./queues";

export type EnqueueOptions = {
   delay?: number;
   priority?: number;
   jobId?: string;
   triggeredBy?: "event" | "manual";
   correlationId?: string;
};

export async function enqueueWorkflowEvent(
   event: WorkflowEvent,
   options: EnqueueOptions = {},
): Promise<string> {
   const queue = getWorkflowQueue();
   if (!queue) {
      throw new Error(
         "Workflow queue not initialized. Call initializeWorkflowQueue first.",
      );
   }

   const jobData: WorkflowJobData = {
      event,
      metadata: {
         correlationId: options.correlationId,
         triggeredBy: options.triggeredBy ?? "event",
      },
   };

   const job = await queue.add(event.type, jobData, {
      delay: options.delay,
      jobId: options.jobId ?? `${event.type}-${event.id}`,
      priority: options.priority,
   });

   return job.id ?? event.id;
}

export function initializeWorkflowQueue(connection: ConnectionOptions): void {
   createWorkflowQueue(connection);
}

export async function enqueueTransactionCreatedEvent(
   event: WorkflowEvent,
   options?: Omit<EnqueueOptions, "triggeredBy">,
): Promise<string> {
   return enqueueWorkflowEvent(event, {
      ...options,
      triggeredBy: "event",
   });
}

export async function enqueueManualWorkflowRun(
   event: WorkflowEvent,
   options?: Omit<EnqueueOptions, "triggeredBy">,
): Promise<string> {
   return enqueueWorkflowEvent(event, {
      ...options,
      triggeredBy: "manual",
   });
}

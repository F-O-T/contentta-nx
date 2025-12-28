import type { DatabaseInstance } from "@packages/database/client";
import type { ConnectionOptions, WorkerOptions } from "@packages/queue/bullmq";
import { type Job, Worker } from "@packages/queue/bullmq";
import type { Resend } from "resend";
import {
	WORKFLOW_QUEUE_NAME,
	type WorkflowJobData,
	type WorkflowJobResult,
} from "./queues";

export type VapidConfig = {
	publicKey: string;
	privateKey: string;
	subject: string;
};

export type WorkflowWorkerConfig = {
	connection: ConnectionOptions;
	db: DatabaseInstance;
	concurrency?: number;
	resendClient?: Resend;
	vapidConfig?: VapidConfig;
	onCompleted?: (
		job: Job<WorkflowJobData, WorkflowJobResult>,
		result: WorkflowJobResult,
	) => void | Promise<void>;
	onFailed?: (
		job: Job<WorkflowJobData, WorkflowJobResult> | undefined,
		error: Error,
	) => void | Promise<void>;
	onProgress?: (
		job: Job<WorkflowJobData, WorkflowJobResult>,
		progress: string | boolean | number | object,
	) => void | Promise<void>;
};

export type WorkflowWorker = {
	worker: Worker<WorkflowJobData, WorkflowJobResult>;
	close: () => Promise<void>;
};

export function createWorkflowWorker(
	config: WorkflowWorkerConfig,
): WorkflowWorker {
	const {
		connection,
		concurrency = 5,
		onCompleted,
		onFailed,
		onProgress,
	} = config;

	const workerOptions: WorkerOptions = {
		concurrency,
		connection,
	};

	const worker = new Worker<WorkflowJobData, WorkflowJobResult>(
		WORKFLOW_QUEUE_NAME,
		async (job: Job<WorkflowJobData, WorkflowJobResult>) => {
			const { event } = job.data;

			// Note: Rules engine was removed. This worker is now a no-op.
			// To re-enable workflow processing, implement the rules engine integration.
			return {
				error: undefined,
				eventId: event.id,
				rulesEvaluated: 0,
				rulesMatched: 0,
				success: true,
			};
		},
		workerOptions,
	);

	if (onCompleted) {
		worker.on("completed", onCompleted);
	}

	if (onFailed) {
		worker.on("failed", onFailed);
	}

	if (onProgress) {
		worker.on("progress", onProgress);
	}

	return {
		close: async () => {
			await worker.close();
		},
		worker,
	};
}

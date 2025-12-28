import type { DatabaseInstance } from "@packages/database/client";
import type { ConnectionOptions, WorkerOptions } from "@packages/queue/bullmq";
import { type Job, Worker } from "@packages/queue/bullmq";
import {
	MAINTENANCE_QUEUE_NAME,
	type MaintenanceJobData,
	type MaintenanceJobResult,
} from "./queues";

export type MaintenanceWorkerConfig = {
	connection: ConnectionOptions;
	db: DatabaseInstance;
	concurrency?: number;
	onCompleted?: (
		job: Job<MaintenanceJobData, MaintenanceJobResult>,
		result: MaintenanceJobResult,
	) => void | Promise<void>;
	onFailed?: (
		job: Job<MaintenanceJobData, MaintenanceJobResult> | undefined,
		error: Error,
	) => void | Promise<void>;
};

export type MaintenanceWorker = {
	worker: Worker<MaintenanceJobData, MaintenanceJobResult>;
	close: () => Promise<void>;
};

export function createMaintenanceWorker(
	config: MaintenanceWorkerConfig,
): MaintenanceWorker {
	const { connection, concurrency = 1, onCompleted, onFailed } = config;

	const workerOptions: WorkerOptions = {
		concurrency,
		connection,
	};

	const worker = new Worker<MaintenanceJobData, MaintenanceJobResult>(
		MAINTENANCE_QUEUE_NAME,
		async (job: Job<MaintenanceJobData, MaintenanceJobResult>) => {
			const { type } = job.data;

			// Note: Maintenance functionality not yet implemented
			return {
				deletedCount: 0,
				error: `Maintenance job type not implemented: ${type}`,
				success: false,
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

	return {
		close: async () => {
			await worker.close();
		},
		worker,
	};
}

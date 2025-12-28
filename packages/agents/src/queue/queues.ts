import type { ConnectionOptions } from "@packages/queue/bullmq";
import { Queue } from "@packages/queue/bullmq";
import type { MastraWorkflowJobData, MastraWorkflowJobResult } from "./schemas";

export const MASTRA_QUEUE_NAME = "mastra-workflows";

let mastraQueue: Queue<MastraWorkflowJobData, MastraWorkflowJobResult> | null =
	null;

export function createMastraQueue(
	connection: ConnectionOptions,
): Queue<MastraWorkflowJobData, MastraWorkflowJobResult> {
	if (mastraQueue) {
		return mastraQueue;
	}

	mastraQueue = new Queue<MastraWorkflowJobData, MastraWorkflowJobResult>(
		MASTRA_QUEUE_NAME,
		{
			connection,
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					delay: 5000,
					type: "exponential",
				},
				removeOnComplete: {
					age: 7 * 24 * 60 * 60, // 7 days
					count: 500,
				},
				removeOnFail: {
					age: 14 * 24 * 60 * 60, // 14 days
				},
			},
		},
	);

	return mastraQueue;
}

export function getMastraQueue(): Queue<
	MastraWorkflowJobData,
	MastraWorkflowJobResult
> | null {
	return mastraQueue;
}

export async function closeMastraQueue(): Promise<void> {
	if (mastraQueue) {
		await mastraQueue.close();
		mastraQueue = null;
	}
}

export type { MastraWorkflowJobData, MastraWorkflowJobResult };

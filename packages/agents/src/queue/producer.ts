import type { ConnectionOptions } from "@packages/queue/bullmq";
import { createMastraQueue, getMastraQueue } from "./queues";
import type {
	CreateContentJobInput,
	CreateKnowledgeJobInput,
	MastraWorkflowJobData,
} from "./schemas";

export type EnqueueOptions = {
	correlationId?: string;
	delay?: number;
	jobId?: string;
	priority?: number;
};

export function initializeMastraQueue(connection: ConnectionOptions): void {
	createMastraQueue(connection);
}

async function enqueueMastraJob(
	data: MastraWorkflowJobData,
	options: EnqueueOptions = {},
): Promise<string> {
	const queue = getMastraQueue();
	if (!queue) {
		throw new Error(
			"Mastra queue not initialized. Call initializeMastraQueue first.",
		);
	}

	const job = await queue.add(data.workflowType, data, {
		delay: options.delay,
		jobId: options.jobId,
		priority: options.priority,
	});

	return job.id ?? crypto.randomUUID();
}

export async function enqueueCreateKnowledgeWorkflow(
	input: Omit<CreateKnowledgeJobInput, "workflowType">,
	options?: EnqueueOptions,
): Promise<string> {
	return enqueueMastraJob(
		{
			workflowType: "create-knowledge-and-index-documents",
			...input,
		},
		{
			...options,
			jobId: options?.jobId ?? `knowledge-${input.brandId}-${Date.now()}`,
		},
	);
}

export async function enqueueCreateContentWorkflow(
	input: Omit<CreateContentJobInput, "workflowType">,
	options?: EnqueueOptions,
): Promise<string> {
	return enqueueMastraJob(
		{
			workflowType: "create-new-content",
			...input,
		},
		{
			...options,
			jobId: options?.jobId ?? `content-${input.contentId}-${Date.now()}`,
		},
	);
}

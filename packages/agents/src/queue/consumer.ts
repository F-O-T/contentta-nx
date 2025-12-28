import type { ConnectionOptions, WorkerOptions } from "@packages/queue/bullmq";
import { type Job, Worker } from "@packages/queue/bullmq";
import { createRequestContext, mastra } from "../mastra/index";
import { MASTRA_QUEUE_NAME } from "./queues";
import type { MastraWorkflowJobData, MastraWorkflowJobResult } from "./schemas";

export type MastraWorkerConfig = {
	concurrency?: number;
	connection: ConnectionOptions;
	onCompleted?: (
		job: Job<MastraWorkflowJobData, MastraWorkflowJobResult>,
		result: MastraWorkflowJobResult,
	) => void | Promise<void>;
	onFailed?: (
		job: Job<MastraWorkflowJobData, MastraWorkflowJobResult> | undefined,
		error: Error,
	) => void | Promise<void>;
	onProgress?: (
		job: Job<MastraWorkflowJobData, MastraWorkflowJobResult>,
		progress: string | boolean | number | object,
	) => void | Promise<void>;
};

export type MastraWorker = {
	close: () => Promise<void>;
	worker: Worker<MastraWorkflowJobData, MastraWorkflowJobResult>;
};

export function createMastraWorker(config: MastraWorkerConfig): MastraWorker {
	const { connection, concurrency = 2, onCompleted, onFailed, onProgress } =
		config;

	const workerOptions: WorkerOptions = {
		concurrency,
		connection,
	};

	const worker = new Worker<MastraWorkflowJobData, MastraWorkflowJobResult>(
		MASTRA_QUEUE_NAME,
		async (job: Job<MastraWorkflowJobData, MastraWorkflowJobResult>) => {
			const { data } = job;

			try {
				// Create request context for Mastra
				const requestContext = createRequestContext({
					agentId:
						data.workflowType === "create-new-content"
							? data.agentId
							: undefined,
					brandId:
						data.workflowType === "create-knowledge-and-index-documents"
							? data.brandId
							: undefined,
					userId: data.userId,
				});

				let runId: string | undefined;

				if (data.workflowType === "create-knowledge-and-index-documents") {
					const workflow = mastra.getWorkflow(
						"createKnowledgeAndIndexDocumentsWorkflow",
					);
					const run = await workflow.createRun();
					runId = run.runId;

					await run.start({
						inputData: {
							brandId: data.brandId,
							userId: data.userId,
							websiteUrl: data.websiteUrl,
						},
						requestContext,
					});
				} else if (data.workflowType === "create-new-content") {
					const workflow = mastra.getWorkflow("createNewContentWorkflow");
					const run = await workflow.createRun();
					runId = run.runId;

					await run.start({
						inputData: {
							agentId: data.agentId,
							competitorIds: data.competitorIds,
							contentId: data.contentId,
							organizationId: data.organizationId,
							request: data.request,
							userId: data.userId,
						},
						requestContext,
					});
				} else {
					throw new Error(
						`Unknown workflow type: ${(data as { workflowType: string }).workflowType}`,
					);
				}

				return {
					completedAt: new Date().toISOString(),
					runId,
					success: true,
					workflowType: data.workflowType,
				};
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				return {
					completedAt: new Date().toISOString(),
					error: message,
					success: false,
					workflowType: data.workflowType,
				};
			}
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

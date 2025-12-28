import { ContentRequestSchema } from "@packages/database/schema";
import { z } from "zod";

// Knowledge workflow input
export const CreateKnowledgeJobInputSchema = z.object({
	brandId: z.string().uuid(),
	organizationId: z.string().uuid(),
	userId: z.string().uuid(),
	websiteUrl: z.string().url(),
	workflowType: z.literal("create-knowledge-and-index-documents"),
});

// Content workflow input
export const CreateContentJobInputSchema = z.object({
	agentId: z.string().uuid(),
	competitorIds: z.array(z.string().uuid()),
	contentId: z.string().uuid(),
	organizationId: z.string().uuid(),
	request: ContentRequestSchema,
	userId: z.string().uuid(),
	workflowType: z.literal("create-new-content"),
});

// Discriminated union for all Mastra workflow jobs
export const MastraWorkflowJobDataSchema = z.discriminatedUnion("workflowType", [
	CreateKnowledgeJobInputSchema,
	CreateContentJobInputSchema,
]);

export type MastraWorkflowJobData = z.infer<typeof MastraWorkflowJobDataSchema>;
export type CreateKnowledgeJobInput = z.infer<
	typeof CreateKnowledgeJobInputSchema
>;
export type CreateContentJobInput = z.infer<typeof CreateContentJobInputSchema>;

// Result types
export const MastraWorkflowJobResultSchema = z.object({
	completedAt: z.string().datetime().optional(),
	error: z.string().optional(),
	outputData: z.unknown().optional(),
	runId: z.string().optional(),
	success: z.boolean(),
	workflowType: z.string(),
});

export type MastraWorkflowJobResult = z.infer<
	typeof MastraWorkflowJobResultSchema
>;

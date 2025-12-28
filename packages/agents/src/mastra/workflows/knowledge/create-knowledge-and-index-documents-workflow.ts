import { createStep, createWorkflow } from "@mastra/core/workflows";
import { MDocument } from "@mastra/rag";
import { createDb } from "@packages/database/client";
import { updateBrand } from "@packages/database/repositories/brand-repository";
import { serverEnv } from "@packages/environment/server";
import { getMinioClient, uploadFile } from "@packages/files/client";
import { createPgVector } from "@packages/rag/client";
import { createBrandKnowledgeWithEmbeddingsBulk } from "@packages/rag/repositories/brand-knowledge-repository";
import { AppError, propagateError } from "@packages/utils/errors";
import { sanitizeDocumentType } from "@packages/utils/file";
import { z } from "zod";
import { documentGenerationAgent } from "../../agents/document-generation-agent";
import { documentSynthesizerAgent } from "../../agents/document-syntethizer-agent";

const uploadDocumentsToStorage = async (
	generatedDocuments: Array<{ type: string; content: string; title: string }>,
	brandId: string,
) => {
	const minioClient = getMinioClient(serverEnv);

	return Promise.all(
		generatedDocuments.map(async (document, index) => {
			const sanitizedType = sanitizeDocumentType(
				document?.type || "document",
			);
			const fileName = `brand-doc-${index + 1}-${sanitizedType}.md`;
			const key = `${brandId}/${fileName}`;
			const contentBuffer = Buffer.from(document.content);

			await uploadFile(
				key,
				contentBuffer,
				"text/markdown",
				serverEnv.MINIO_BUCKET,
				minioClient,
			);

			return {
				id: `${brandId}-doc-${index + 1}`,
				name: fileName,
				url: key,
				type: "text/markdown",
				size: contentBuffer.length,
				uploadedAt: new Date().toISOString(),
			};
		}),
	);
};

// Input schema for the workflow
export const CreateKnowledgeAndIndexDocumentsInput = z.object({
	brandId: z.string(),
	userId: z.string(),
	websiteUrl: z.url(),
});

// Output schema for the workflow
export const CreateKnowledgeAndIndexDocumentsOutput = z.object({
	chunkCount: z.number(),
});

const createDocumentsOutputSchema =
	CreateKnowledgeAndIndexDocumentsInput.extend({
		generatedDocuments: z
			.array(
				z.object({
					content: z
						.string()
						.describe(
							"Complete document content in perfect markdown format",
						),
					title: z.string().describe("Document title"),
					type: z.string().describe("Document type"),
				}),
			)
			.length(5)
			.describe(
				"Exactly 5 business documents generated from brand analysis",
			),
	});
const getFullAnalysisOutputSchema =
	CreateKnowledgeAndIndexDocumentsInput.extend({
		fullAnalysis: z
			.string()
			.describe("Complete analysis document in perfect markdown format"),
	});
const getFullAnalysis = createStep({
	description: "Get full analysis from website",

	execute: async ({ inputData, requestContext }) => {
		const { userId, websiteUrl, brandId } = inputData;

		try {
			const inputPrompt = `
websiteUrl: ${websiteUrl}
userId: ${userId}
`;
			const result = await documentSynthesizerAgent.generate(
				[
					{
						content: inputPrompt,
						role: "user",
					},
				],
				{
					structuredOutput: {
						schema: getFullAnalysisOutputSchema.pick({
							fullAnalysis: true,
						}),
					},
					requestContext,
				},
			);

			if (!result?.object) {
				console.error(
					`[getFullAnalysis] Failed to generate analysis: documentSynthesizerAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
				);
				propagateError(new Error("Failed to generate analysis"));
				throw AppError.internal("Failed to generate analysis from website");
			}

			const { fullAnalysis } = result.object;

			return {
				fullAnalysis,
				brandId,
				userId,
				websiteUrl,
			};
		} catch (err) {
			console.error(
				`[getFullAnalysis] Failed to get full analysis from website ${websiteUrl}:`,
				err,
			);
			propagateError(err);
			throw AppError.internal("Failed to get full analysis from website");
		}
	},
	id: "get-full-analysis-step",
	inputSchema: CreateKnowledgeAndIndexDocumentsInput,
	outputSchema: getFullAnalysisOutputSchema,
});

const createDocuments = createStep({
	description: "Create business documents from analysis",
	execute: async ({ inputData, requestContext }) => {
		const { fullAnalysis, userId, brandId, websiteUrl } = inputData;

		try {
			const inputPrompt = `

${fullAnalysis}

`;

			const result = await documentGenerationAgent.generate(
				[
					{
						content: inputPrompt,
						role: "user",
					},
				],
				{
					structuredOutput: {
						schema: createDocumentsOutputSchema,
					},
					requestContext,
				},
			);

			if (!result?.object) {
				console.error(
					`[createDocuments] Failed to generate documents: documentGenerationAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
				);
				propagateError(new Error("Failed to generate documents"));
				throw AppError.internal(
					"Failed to generate business documents from analysis",
				);
			}

			const { generatedDocuments } = result.object;
			return {
				generatedDocuments,
				brandId,
				userId,
				websiteUrl,
			};
		} catch (err) {
			console.error(
				`[createDocuments] Failed to create documents from analysis for brand ${brandId}:`,
				err,
			);
			propagateError(err);
			throw AppError.internal(
				"Failed to create business documents from analysis",
			);
		}
	},
	id: "create-documents-step",
	inputSchema: getFullAnalysisOutputSchema,
	outputSchema: createDocumentsOutputSchema,
});

const saveBrandDocumentsKnowledge = createStep({
	description:
		"Save brand documents knowledge to database and create embeddings",
	execute: async ({ inputData }) => {
		const { generatedDocuments, brandId } = inputData;

		try {
			const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
			const ragClient = createPgVector({
				pgVectorURL: serverEnv.PG_VECTOR_URL,
			});

			if (!generatedDocuments || generatedDocuments.length === 0) {
				throw AppError.validation("No documents provided for saving");
			}

			// Upload documents to storage
			const uploadedFiles = await uploadDocumentsToStorage(
				generatedDocuments,
				brandId,
			);

			// Update brand with uploaded files and status
			await updateBrand(db, brandId, { status: "completed", uploadedFiles });

			const knowledgeData: Parameters<
				typeof createBrandKnowledgeWithEmbeddingsBulk
			>[1] = [];

			for (const [index, document] of generatedDocuments.entries()) {
				const doc = MDocument.fromMarkdown(document.content);
				const chunks = await doc.chunk({
					maxSize: 128,
					overlap: 25,
					strategy: "markdown",
				});

				for (const chunk of chunks) {
					knowledgeData.push({
						chunk: chunk.text,
						externalId: brandId,
						sourceId: `brand-doc-${index}`,
						type: "document",
					});
				}
			}

			await createBrandKnowledgeWithEmbeddingsBulk(ragClient, knowledgeData);

			return {
				chunkCount: knowledgeData.length,
			};
		} catch (err) {
			console.error("failed to save brand documents", err);
			propagateError(err);
			throw AppError.internal(
				"Failed to save brand documents knowledge to database and vector store",
			);
		}
	},
	id: "save-brand-documents-knowledge-step",
	inputSchema: createDocumentsOutputSchema,
	outputSchema: CreateKnowledgeAndIndexDocumentsOutput,
});

export const createKnowledgeAndIndexDocumentsWorkflow = createWorkflow({
	description: "Create knowledge and index documents from analysis",
	id: "create-knowledge-and-index-documents",
	inputSchema: CreateKnowledgeAndIndexDocumentsInput,
	outputSchema: CreateKnowledgeAndIndexDocumentsOutput,
})
	.then(getFullAnalysis)
	.then(createDocuments)
	.then(saveBrandDocumentsKnowledge)
	.commit();

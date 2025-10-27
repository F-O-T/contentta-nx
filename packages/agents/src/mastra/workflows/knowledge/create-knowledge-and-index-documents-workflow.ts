import { createWorkflow, createStep } from "@mastra/core/workflows";
import { documentSynthesizerAgent } from "../../agents/document-syntethizer-agent";
import { documentGenerationAgent } from "../../agents/document-generation-agent";
import { MDocument } from "@mastra/rag";
import { uploadFile, getMinioClient } from "@packages/files/client";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import { updateBrand } from "@packages/database/repositories/brand-repository";
import { z } from "zod";
import { createPgVector } from "@packages/rag/client";
import { createCompetitorKnowledgeWithEmbeddingsBulk } from "@packages/rag/repositories/competitor-knowledge-repository";
import { createBrandKnowledgeWithEmbeddingsBulk } from "@packages/rag/repositories/brand-knowledge-repository";
import { AppError, propagateError } from "@packages/utils/errors";
import { sanitizeDocumentType } from "@packages/utils/file";
import { ingestUsage, type MastraLLMUsage } from "../../helpers";

const uploadDocumentsToStorage = async (
   generatedDocuments: Array<{ type: string; content: string; title: string }>,
   id: string,
   target: "brand" | "competitor",
) => {
   const minioClient = getMinioClient(serverEnv);

   return Promise.all(
      generatedDocuments.map(async (document, index) => {
         const sanitizedType = sanitizeDocumentType(
            document?.type || "document",
         );
         const fileName = `${target}-doc-${index + 1}-${sanitizedType}.md`;
         const key = `${id}/${fileName}`;

         await uploadFile(
            key,
            Buffer.from(document.content),
            "text/markdown",
            serverEnv.MINIO_BUCKET,
            minioClient,
         );

         return {
            fileName,
            fileUrl: key,
            uploadedAt: new Date().toISOString(),
         };
      }),
   );
};

// Input schema for the workflow
export const CreateKnowledgeAndIndexDocumentsInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   id: z.string(),
   target: z.enum(["brand", "competitor"]),
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
               type: z.string().describe("Document type"),
               content: z
                  .string()
                  .describe(
                     "Complete document content in perfect markdown format",
                  ),
               title: z.string().describe("Document title"),
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
   id: "get-full-analysis-step",
   description: "Get full analysis from website",
   inputSchema: CreateKnowledgeAndIndexDocumentsInput,
   outputSchema: getFullAnalysisOutputSchema,

   execute: async ({ inputData, runtimeContext }) => {
      const { userId, websiteUrl, id, target } = inputData;

      try {
         const inputPrompt = `
websiteUrl: ${websiteUrl}
userId: ${userId}
`;
         const result = await documentSynthesizerAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
               output: getFullAnalysisOutputSchema.pick({
                  fullAnalysis: true,
               }),
            },
         );

         await ingestUsage(result.usage as MastraLLMUsage, userId);
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
            userId,
            websiteUrl,
            id,
            target,
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
});

const createDocuments = createStep({
   id: "create-documents-step",
   description: "Create business documents from analysis",
   inputSchema: getFullAnalysisOutputSchema,
   outputSchema: createDocumentsOutputSchema,
   execute: async ({ inputData, runtimeContext }) => {
      const { fullAnalysis, userId, id, target, websiteUrl } = inputData;

      try {
         const inputPrompt = `

${fullAnalysis}

`;

         const result = await documentGenerationAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
               output: createDocumentsOutputSchema,
            },
         );

         await ingestUsage(result.usage as MastraLLMUsage, userId);
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
            userId,
            websiteUrl,
            id,
            target,
         };
      } catch (err) {
         console.error(
            `[createDocuments] Failed to create documents from analysis for ${target} ${id}:`,
            err,
         );
         propagateError(err);
         throw AppError.internal(
            "Failed to create business documents from analysis",
         );
      }
   },
});

const saveBrandDocumentsKnowledge = createStep({
   id: "save-brand-documents-knowledge-step",
   description:
      "Save brand documents knowledge to database and create embeddings",
   inputSchema: createDocumentsOutputSchema,
   outputSchema: CreateKnowledgeAndIndexDocumentsOutput,
   execute: async ({ inputData }) => {
      const { generatedDocuments, id } = inputData;

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
            id,
            "brand",
         );

         // Update brand with uploaded files and status
         await updateBrand(db, id, { uploadedFiles, status: "completed" });

         const knowledgeData: Parameters<
            typeof createBrandKnowledgeWithEmbeddingsBulk
         >[1] = [];

         for (const [index, document] of generatedDocuments.entries()) {
            const doc = MDocument.fromMarkdown(document.content);
            const chunks = await doc.chunk({
               strategy: "markdown",
               maxSize: 128,
               overlap: 25,
            });

            for (const chunk of chunks) {
               knowledgeData.push({
                  chunk: chunk.text,
                  externalId: id,
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
});

const saveCompetitorDocumentsKnowledge = createStep({
   id: "save-competitor-documents-knowledge-step",
   description:
      "Save competitor documents knowledge to database and create embeddings",
   inputSchema: createDocumentsOutputSchema,
   outputSchema: CreateKnowledgeAndIndexDocumentsOutput,
   execute: async ({ inputData }) => {
      const { generatedDocuments, id } = inputData;

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
            id,
            "competitor",
         );

         await updateCompetitor(db, id, { uploadedFiles, status: "completed" });

         const knowledgeData: Parameters<
            typeof createCompetitorKnowledgeWithEmbeddingsBulk
         >[1] = [];

         for (const [index, document] of generatedDocuments.entries()) {
            const doc = MDocument.fromMarkdown(document.content);
            const chunks = await doc.chunk({
               strategy: "semantic-markdown",
               maxSize: 128,
               overlap: 25,
            });

            for (const chunk of chunks) {
               knowledgeData.push({
                  chunk: chunk.text,
                  externalId: id,
                  sourceId: `competitor-doc-${index}`,
                  type: "document",
               });
            }
         }

         await createCompetitorKnowledgeWithEmbeddingsBulk(
            ragClient,
            knowledgeData,
         );

         return {
            chunkCount: knowledgeData.length,
         };
      } catch (err) {
         console.error("failed to save competitor documents", err);
         propagateError(err);
         throw AppError.internal(
            "Failed to save competitor documents knowledge to database and vector store",
         );
      }
   },
});

export const createKnowledgeAndIndexDocumentsWorkflow = createWorkflow({
   id: "create-knowledge-and-index-documents",
   description: "Create knowledge and index documents from analysis",
   inputSchema: CreateKnowledgeAndIndexDocumentsInput,
   outputSchema: CreateKnowledgeAndIndexDocumentsOutput,
})
   .then(getFullAnalysis)
   .then(createDocuments)
   .branch([
      [
         async ({ inputData: { target } }) => target === "competitor",
         saveCompetitorDocumentsKnowledge,
      ],
      [
         async ({ inputData: { target } }) => target === "brand",
         saveBrandDocumentsKnowledge,
      ],
   ])
   .commit();

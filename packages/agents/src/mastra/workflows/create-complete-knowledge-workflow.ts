import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { createFeaturesKnowledgeWorkflow } from "./knowledge/create-features-knowledge-workflow";
import { createKnowledgeAndIndexDocumentsWorkflow } from "./knowledge/create-knowledge-and-index-documents-workflow";

export const CreateCompleteKnowledgeInput = z.object({
   id: z.string(),
   target: z.enum(["brand", "competitor"]),
   userId: z.string(),
   websiteUrl: z.url(),
});

export const CreateCompleteKnowledgeOutput = z.object({
   "create-features-knowledge": z.object({
      chunkCount: z.number(),
   }),
   "create-knowledge-and-index-documents": z.object({
      chunkCount: z.number(),
   }),
});

export const createCompleteKnowledgeWorkflow = createWorkflow({
   description:
      "Run all knowledge workflows in parallel and set final status based on target",
   id: "create-complete-knowledge",
   inputSchema: CreateCompleteKnowledgeInput,
   outputSchema: CreateCompleteKnowledgeOutput,
})
   .parallel([
      createFeaturesKnowledgeWorkflow,
      createKnowledgeAndIndexDocumentsWorkflow,
   ])
   .commit();

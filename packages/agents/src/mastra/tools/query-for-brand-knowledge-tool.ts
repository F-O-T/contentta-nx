import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createPgVector } from "@packages/rag/client";
import { searchBrandKnowledgeByTextAndExternalId } from "@packages/rag/repositories/brand-knowledge-repository";
import { AppError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
export function getQueryBrandKnowledgeInstructions(): string {
   return `
## QUERY BRAND KNOWLEDGE TOOL
Searches vector database for brand information and app features.
**When to use:** User asks about company info or app functionality
**Parameters:**
- externalId (string): Brand identifier from context
- searchTerm (string): Key terms from user's question (2-5 words)
- type (enum): "document" for company/brand info, "feature" for app functionality
**Examples:**
"return policy" (document), "export data" (feature), "brand values" (document)
`;
}
export const queryForBrandKnowledgeTool = createTool({
   description: "Query the pg vector database for brand knowledge",
   execute: async (inputData, context) => {
      const { searchTerm, type } = inputData;
      const requestContext = context?.requestContext;
      if (!requestContext?.has("brandId")) {
         throw AppError.validation("Missing brandId in request context");
      }
      const externalId = requestContext.get("brandId") as string;
      try {
         const ragClient = createPgVector({
            pgVectorURL: serverEnv.PG_VECTOR_URL,
         });
         const results = await searchBrandKnowledgeByTextAndExternalId(
            ragClient,
            searchTerm,
            externalId,
            {
               limit: 5,
               similarityThreshold: 0,
               type,
            },
         );
         return { results };
      } catch (error) {
         console.error("Failed to search brand knowledge:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to search brand knowledge: ${(error as Error).message}`,
         );
      }
   },
   id: "query-for-brand-knowledge",
   inputSchema: z.object({
      searchTerm: z.string().describe("The search term to query the database"),
      type: z
         .enum(["document", "feature"])
         .describe("The type of knowledge to search for"),
   }),
});

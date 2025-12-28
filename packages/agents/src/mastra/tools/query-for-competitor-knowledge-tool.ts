import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createPgVector } from "@packages/rag/client";
import { searchCompetitorKnowledgeByTextAndExternalId } from "@packages/rag/repositories/competitor-knowledge-repository";
import { AppError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
export function getQueryCompetitorKnowledgeInstructions(): string {
   return `
## COMPETITOR KNOWLEDGE QUERY TOOL
Searches vector database for competitor intelligence (features, strategies, updates).
**When to use:** Analyze competitors, gather competitive intelligence, research market positioning
**Parameters:**
- externalIds (string[]): Competitor identifiers to search
- searchTerm (string): Query keywords (e.g., "features", "pricing", "strategy")
- type (enum): "document" (general info) or "feature" (specific capabilities)
**Strategy:**
Make 2-4 targeted searches with varied terms for comprehensive analysis
**Examples:**
Good: searchTerm="AI features", type="feature" | searchTerm="recent updates", type="document"
Bad: searchTerm="competitor" (too vague)
`;
}
export const queryForCompetitorKnowledgeTool = createTool({
   description: "Query the pg vector database for competitor knowledge",
   execute: async (inputData) => {
      const { externalIds, searchTerm, type } = inputData;

      try {
         const ragClient = createPgVector({
            pgVectorURL: serverEnv.PG_VECTOR_URL,
         });
         const results = await searchCompetitorKnowledgeByTextAndExternalId(
            ragClient,
            searchTerm,
            externalIds,
            {
               limit: 20,
               similarityThreshold: 0,
               type,
            },
         );
         // Always return something, even if it's an empty array
         return { results: results || [] };
      } catch (error) {
         console.error("Failed to search competitor knowledge:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to search competitor knowledge: ${(error as Error).message}`,
         );
      }
   },
   id: "query-for-competitor-knowledge",
   inputSchema: z.object({
      externalIds: z
         .array(z.string())
         .describe("An array of external ids for identifying the competitors"),
      searchTerm: z.string().describe("The search term to query the database"),
      type: z
         .enum(["document", "feature"])
         .describe("The type of knowledge to search for"),
   }),
});

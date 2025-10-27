import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { searchContent } from "@packages/database/repositories/content-repository";
import { AppError, propagateError } from "@packages/utils/errors";
import { listAgents } from "@packages/database/repositories/agent-repository";

export function getSearchTutorialsInstructions(): string {
   return `
## SEARCH TUTORIALS TOOL
Searches through all tutorials the user has written based on various criteria.

**When to use:** Need to find existing tutorials on specific topics, with certain keywords, or matching specific criteria

**Parameters:**
- query (string): Search term to look for in titles, descriptions, or content
- keywords (array of strings): Specific keywords to search for (optional)
- limit (number): Maximum number of results to return (default: 10, max: 50)

**Returns:** Array of tutorials matching the search criteria with metadata like title, description, keywords, status, and creation date

**Strategy:** Use this tool to find relevant existing tutorials before creating new content to avoid duplication and build upon existing work.
`;
}

export const searchTutorialsTool = createTool({
   id: "search-tutorials",
   description: "Searches through user's written tutorials",
   inputSchema: z.object({
      query: z
         .string()
         .optional()
         .describe(
            "Search term to look for in titles, descriptions, or content",
         ),
      keywords: z
         .array(z.string())
         .optional()
         .describe("Specific keywords to search for"),
      limit: z
         .number()
         .min(1)
         .max(50)
         .default(10)
         .describe("Maximum number of results to return"),
   }),
   execute: async ({ context, runtimeContext }) => {
      const { query, keywords, limit = 10 } = context;

      if (!runtimeContext.has("userId")) {
         throw AppError.internal("User ID is required in runtime context");
      }
      const userId = runtimeContext.get("userId") as string;

      try {
         const dbClient = createDb({
            databaseUrl: serverEnv.DATABASE_URL,
         });

         const agents = await listAgents(dbClient, {
            userId,
            limit: 20,
         });

         const { results } = await searchContent(
            dbClient,
            agents.map((agent) => agent.id),
            query || "",
            {
               status: ["approved", "draft"],
               layout: ["tutorial"],
               includeBody: true,
               limit: Math.min(limit, 50),
               offset: 0,
            },
         );

         return {
            results,
         };
      } catch (error) {
         console.error(
            `Tutorial search failed  query="${query}", keywords=${JSON.stringify(keywords)}`,
            error,
         );
         propagateError(error);
         throw AppError.internal(
            `Tutorial search failed: ${(error as Error).message}`,
         );
      }
   },
});

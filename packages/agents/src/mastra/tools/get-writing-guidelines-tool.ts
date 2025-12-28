import { createTool } from "@mastra/core/tools";
import { createDb } from "@packages/database/client";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
export function getWritingGuidelinesInstructions(): string {
   return `
## WRITING GUIDELINES TOOL
Retrieves specific writing rules, style preferences, and formatting requirements for content creation.
**When to use:** Before drafting content to understand style rules, tone preferences, and structural requirements
**Parameters:**
- agentId (UUID): Agent identifier containing writing guidelines configuration
**Returns:** Writing guidelines or "No writing guidelines specified"
**Strategy:** Call early in writing process to ensure content adheres to brand voice, formatting standards, and stylistic preferences throughout composition
`;
}
export const getWritingGuidelinesTool = createTool({
   description: "Retrieve the writing guidelines for content creation",
   execute: async (_inputData, context) => {
      const requestContext = context?.requestContext;
      if (!requestContext?.has("agentId")) {
         throw AppError.internal("Agent ID is required in request context");
      }
      const agentId = requestContext.get("agentId") as string;

      try {
         const dbClient = createDb({
            databaseUrl: serverEnv.DATABASE_URL,
         });

         const agent = await getAgentById(dbClient, agentId);
         const writingGuidelines =
            agent?.personaConfig?.instructions?.writingGuidelines;

         return {
            writingGuidelines:
               writingGuidelines || "No writing guidelines specified",
         };
      } catch (error) {
         console.error("Failed to retrieve writing guidelines:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to retrieve writing guidelines: ${(error as Error).message}`,
         );
      }
   },
   id: "get-writing-guidelines",
});

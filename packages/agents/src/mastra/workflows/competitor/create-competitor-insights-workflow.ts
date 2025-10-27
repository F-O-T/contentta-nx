import { createWorkflow, createStep } from "@mastra/core/workflows";
import { competitorIntelligenceAgent } from "../../agents/competitor-intelligence-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import { ingestUsage, type MastraLLMUsage } from "../../helpers";
import { z } from "zod";
import { CompetitorFindingsSchema } from "@packages/database/schema";

export const CreateCompetitorInsightsInput = z.object({
   organizationId: z.string(),
   userId: z.string(),
   competitorId: z.string(),
});

export const CreateCompetitorInsightsOutput = z.object({
   findings: CompetitorFindingsSchema,
   competitorId: z.string(),
});

// Step 1: Generate insights for a single competitor using AI
const generateInsights = createStep({
   id: "generate-insights-step",
   description: "Generate competitor insights and priorities using AI analysis",
   inputSchema: CreateCompetitorInsightsInput,
   outputSchema: CreateCompetitorInsightsInput.extend({
      findings: CompetitorFindingsSchema,
   }),

   execute: async ({ inputData, runtimeContext }) => {
      const { organizationId, userId, competitorId } = inputData;

      try {
         const inputPrompt = `
Based on the competitor with ID: ${competitorId}, please analyze this competitor and generate structured insights and priorities.

Generate:
1. Key insights about this competitor's strategies, features, or market position
2. Actionable priorities based on the competitive analysis, ordered by importance

Return the results as JSON with:
- insights: array of strings (key insights about the competitor)
- priorities: array of strings (actionable recommendations ordered by importance)

Focus on specific, actionable intelligence that would be valuable for strategic planning.
`;

         const result = await competitorIntelligenceAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
               output: CompetitorFindingsSchema,
            },
         );

         // Charge user for AI usage
         await ingestUsage(result.usage as MastraLLMUsage, userId);

         if (!result?.object) {
            throw new Error(
               "Failed to generate competitor insights - no insights content returned",
            );
         }

         return {
            organizationId,
            userId,
            competitorId,
            findings: result.object,
         };
      } catch (err) {
         console.error("Failed to generate competitor insights:", err);
         throw new Error(
            `Competitor insights generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
         );
      }
   },
});

// Step 2: Save the insights to competitor table
const saveInsights = createStep({
   id: "save-insights-step",
   description: "Save the generated insights to the competitor table",
   inputSchema: CreateCompetitorInsightsInput.extend({
      findings: CompetitorFindingsSchema,
   }),
   outputSchema: CreateCompetitorInsightsOutput,

   execute: async ({ inputData }) => {
      const { competitorId, findings } = inputData;

      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

         await updateCompetitor(db, competitorId, {
            findings,
         });

         return {
            findings,
            competitorId,
         };
      } catch (err) {
         console.error("Failed to save competitor insights:", err);
         throw new Error(
            `Failed to save insights to database: ${err instanceof Error ? err.message : "Unknown error"}`,
         );
      }
   },
});

export const createCompetitorInsightsWorkflow = createWorkflow({
   id: "create-competitor-insights",
   description:
      "Generate competitor insights and priorities from competitive analysis",
   inputSchema: CreateCompetitorInsightsInput,
   outputSchema: CreateCompetitorInsightsOutput,
})
   .then(generateInsights)
   .then(saveInsights)
   .commit();

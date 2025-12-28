import { createStep, createWorkflow } from "@mastra/core/workflows";
import { createDb } from "@packages/database/client";
import { updateContent } from "@packages/database/repositories/content-repository";
import { ContentRequestSchema } from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { emitContentStatusChanged } from "@packages/server-events";
import { APIError, AppError, propagateError } from "@packages/utils/errors";
import {
   createDescriptionFromText,
   getKeywordsFromText,
} from "@packages/utils/text";
import { z } from "zod";
import { createEditorAgent } from "../../agents/content/content-editor-agent";
import { createReaderAgent } from "../../agents/content/content-reader-agent";
import { createWriterAgent } from "../../agents/content/content-writer-agent";
import { researcherAgent } from "../../agents/researcher-agent";
import { contentStrategistAgent } from "../../agents/strategist-agent";

const articleWriterAgent = createWriterAgent("article");
const articleEditorAgent = createEditorAgent("article");
const articleReaderAgent = createReaderAgent("article");

// Valid database statuses - matches content schema enum
const DB_STATUSES = ["draft", "published", "archived"] as const;
type DbStatus = (typeof DB_STATUSES)[number];

function isDbStatus(status: string): status is DbStatus {
   return DB_STATUSES.includes(status as DbStatus);
}

// Internal helper function to update content status and emit events
async function updateContentStatus(
   payload: Parameters<typeof emitContentStatusChanged>[0],
) {
   try {
      const { contentId, status, message, layout } = payload;

      // Only update database for valid database statuses
      if (isDbStatus(status)) {
         const db = createDb({
            databaseUrl: serverEnv.DATABASE_URL,
         });

         await updateContent(db, contentId, {
            status,
         });
      }

      emitContentStatusChanged({
         contentId,
         layout,
         message,
         status,
      });
   } catch (error) {
      console.error("Failed to update content status:", error);
      propagateError(error);
      throw APIError.internal("Failed to update content status");
   }
}

const CreateNewContentWorkflowInputSchema = z.object({
   agentId: z.string(),
   competitorIds: z.array(z.string()),
   contentId: z.string(),
   organizationId: z.string(),
   request: ContentRequestSchema,
   userId: z.string(),
});
const writingType = z
   .string()
   .describe("The detailed article draft, ready for editing");

const editorType = z.string().describe("The edited article, ready for review");
const StrategyStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   strategy: z.object({
      brandInsights: z.string(),
      brandPositioning: z.string().describe("The brand positioning strategy"),
      competitorInsights: z.string(),
      contentAngles: z.string(),
      keyMessages: z.string(),
      uniqueDifferentiators: z.string(),
   }),
}).omit({
   competitorIds: true,
   organizationId: true,
});
export const strategyStep = createStep({
   description: "Create brand-aligned content strategy",
   execute: async ({ inputData, requestContext }) => {
      try {
         const {
            contentId,
            userId,
            agentId,
            competitorIds,
            organizationId,
            request,
         } = inputData;

         // Emit event when strategy starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Developing content strategy for your article...",
            status: "pending",
         });

         const inputPrompt = `
I need you to create a comprehensive content strategy for the following request:

**User Request:** ${request.description}
**Content Type:** ${request.layout}
**Organization ID:** ${organizationId}
**Competitor IDs:** ${competitorIds.join(", ")}

Please develop a strategic brief that:
1. Analyzes user intent and content expectations
2. Leverages brand knowledge to identify unique positioning opportunities
3. Analyzes competitive landscape using competitor intelligence
4. Creates a differentiated content strategy with clear recommendations
5. Defines specific content requirements and success metrics

Focus on creating a strategy that leverages our brand's unique strengths and differentiates us from competitors.
`;

         const result = await contentStrategistAgent.generate(
            [
               {
                  content: inputPrompt,
                  role: "user",
               },
            ],
            {
               structuredOutput: {
                  schema: StrategyStepOutputSchema.pick({
                     strategy: true,
                  }),
               },
               requestContext,
            },
         );

         if (!result?.object.strategy) {
            throw AppError.validation(
               'Agent output is missing "strategy" field',
            );
         }

         // Emit event when strategy completes
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Article strategy completed",
            status: "pending",
         });

         return {
            agentId,
            contentId,
            request,
            strategy: result.object.strategy,
            userId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            layout: inputData.request.layout,
            message: "Failed to create article strategy",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to create article strategy: ${(error as Error).message}`,
         );
      }
   },
   id: "article-strategy-step",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: StrategyStepOutputSchema,
});

const ResearchStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   competitorAnalysis: z
      .string()
      .describe("Analysis of top ranking competitors and their strategies"),
   contentGaps: z
      .string()
      .describe("Content gaps and opportunities identified"),
   searchIntent: z.string().describe("The search intent and user expectations"),
   sources: z
      .array(z.string())
      .describe("The URLs found during web search research"),
   strategicRecommendations: z
      .string()
      .describe("Strategic recommendations for outranking competitors"),
}).omit({
   competitorIds: true,
   organizationId: true,
});

export const researchStep = createStep({
   description: "Perform SERP research and competitive analysis",
   execute: async ({ inputData, requestContext }) => {
      try {
         const { contentId, userId, agentId, request } = inputData;

         // Emit event when research starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Researching for your article...",
            status: "pending",
         });

         const inputPrompt = `
I need you to perform SERP research for the following content request:

**Topic:** ${request.description}
**Content Type:** ${request.layout}

Please conduct SERP analysis to identify:
1. Search intent and user expectations
2. Top ranking competitors and their strategies
3. Content gaps and opportunities
4. Strategic recommendations for content
5. Source URLs from web searches used for research

Focus on the research findings only and include actual URLs found during your web searches.
`;

         const result = await researcherAgent.generate(
            [
               {
                  content: inputPrompt,
                  role: "user",
               },
            ],
            {
               structuredOutput: {
                  schema: ResearchStepOutputSchema.omit({
                     agentId: true,
                     contentId: true,
                     request: true,
                     userId: true,
                  }),
               },
               requestContext,
            },
         );

         console.log("Research Agent Result:", result.object);
         if (!result?.object.searchIntent) {
            throw AppError.validation(
               'Agent output is missing "searchIntent" field',
            );
         }

         // Emit event when research completes
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Article research completed",
            status: "pending",
         });

         return {
            ...result.object,
            agentId,
            contentId,
            request,
            userId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            layout: inputData.request.layout,
            message: "Failed to research article",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to research article: ${(error as Error).message}`,
         );
      }
   },
   id: "article-research-step",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ResearchStepOutputSchema,
});
const ContentWritingStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      sources: z
         .array(z.string())
         .describe("The URLs found during web search research"),
      writing: writingType,
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const ArticleWritingStepInputSchema = z.object({
   "article-research-step": ResearchStepOutputSchema,
   "article-strategy-step": StrategyStepOutputSchema,
});
const articleWritingStep = createStep({
   description: "Write the article based on the content strategy and research",
   execute: async ({ inputData, requestContext }) => {
      try {
         const {
            "article-research-step": {
               request,
               contentId,
               agentId,
               searchIntent,
               competitorAnalysis,
               contentGaps,
               strategicRecommendations,
               sources,
               userId,
            },
            "article-strategy-step": { strategy },
         } = inputData;

         // Emit event when writing starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Writing your article...",
            status: "pending",
         });

         const strategyPrompt = `
brandInsights: ${strategy.brandInsights}
      
competitorInsights: ${strategy.competitorInsights}
      
uniqueDifferentiators: ${strategy.uniqueDifferentiators}
      
keyMessages: ${strategy.keyMessages}
      
contentAngles: ${strategy.contentAngles}
      
brandPositioning: ${strategy.brandPositioning}
         
`;
         const researchPrompt = `
searchIntent: ${searchIntent}
competitorAnalysis: ${competitorAnalysis}
contentGaps: ${contentGaps}
strategicRecommendations: ${strategicRecommendations}
`;
         const inputPrompt = `
create a new ${request.layout} based on the conent request.

request: ${request.description}

${strategyPrompt}

${researchPrompt}

`;
         const result = await articleWriterAgent.generate(
            [
               {
                  content: inputPrompt,
                  role: "user",
               },
            ],
            {
               structuredOutput: {
                  schema: ContentWritingStepOutputSchema.pick({
                     writing: true,
                  }),
               },
               requestContext,
            },
         );

         if (!result?.object.writing) {
            throw AppError.validation(
               'Agent output is missing "research" field',
            );
         }

         // Emit event when writing completes
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Article draft completed",
            status: "pending",
         });

         return {
            agentId,
            contentId,
            request,
            sources,
            userId,
            writing: result.object.writing,
         };
      } catch (error) {
         // Extract contentId and layout from the appropriate input data structure
         const { contentId, request } = inputData["article-research-step"];
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Failed to write article",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to write article: ${(error as Error).message}`,
         );
      }
   },
   id: "article-writing-step",
   inputSchema: ArticleWritingStepInputSchema,
   outputSchema: ContentWritingStepOutputSchema,
});
const ContentEditorStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      editor: editorType,
      sources: z
         .array(z.string())
         .describe("The URLs found during web search research"),
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const articleEditorStep = createStep({
   description: "Edit the article based on the content research",
   execute: async ({ inputData, requestContext }) => {
      try {
         const { userId, contentId, request, agentId, writing, sources } =
            inputData;

         // Emit event when editing starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Editing your article...",
            status: "pending",
         });

         const inputPrompt = `
i need you to edit this ${request.layout} draft.

writing: ${writing}

output the edited content in markdown format.
`;
         const result = await articleEditorAgent.generate(
            [
               {
                  content: inputPrompt,
                  role: "user",
               },
            ],
            {
               structuredOutput: {
                  schema: ContentEditorStepOutputSchema.pick({
                     editor: true,
                  }),
               },
               requestContext,
            },
         );

         if (!result?.object.editor) {
            throw AppError.validation('Agent output is missing "editor" field');
         }

         // Emit event when editing completes
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Article editing completed",
            status: "pending",
         });

         return {
            agentId,
            contentId,
            editor: result.object.editor,
            request,
            sources,
            userId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            layout: inputData.request.layout,
            message: "Failed to edit article",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to edit article: ${(error as Error).message}`,
         );
      }
   },
   id: "article-editor-step",
   inputSchema: ContentWritingStepOutputSchema,
   outputSchema: ContentEditorStepOutputSchema,
});

const ContentReviewerStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      editor: editorType,
      rating: z.number().min(0).max(100),
      reasonOfTheRating: z
         .string()
         .describe("The reason for the rating, written in markdown"),
      sources: z.array(z.string()).describe("The sources found on the search"),
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
export const articleReadAndReviewStep = createStep({
   description: "Read and review the article",
   execute: async ({ inputData, requestContext }) => {
      try {
         const { contentId, sources, userId, agentId, request, editor } =
            inputData;

         // Emit event when review starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Reviewing your article...",
            status: "pending",
         });

         const inputPrompt = `
i need you to read and review this ${request.layout}.


original:${request.description}

final:${editor}

`;
         const result = await articleReaderAgent.generate(
            [
               {
                  content: inputPrompt,
                  role: "user",
               },
            ],
            {
               structuredOutput: {
                  schema: ContentReviewerStepOutputSchema.pick({
                     rating: true,
                     reasonOfTheRating: true,
                  }),
               },
               requestContext,
            },
         );
         if (!result?.object.rating) {
            throw AppError.validation('Agent output is missing "review" field');
         }
         if (!result?.object.reasonOfTheRating) {
            throw AppError.validation(
               'Agent output is missing "reasonOfTheRating" field',
            );
         }

         // Emit event when review completes
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Article review completed",
            status: "pending",
         });

         return {
            agentId,
            contentId,
            editor,
            rating: result.object.rating,
            reasonOfTheRating: result.object.reasonOfTheRating,
            request,
            sources,
            userId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            layout: inputData.request.layout,
            message: "Failed to review article",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to review article: ${(error as Error).message}`,
         );
      }
   },
   id: "article-read-and-review-step",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
});

const SeoOptimizationStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      keywords: z
         .array(z.string())
         .describe(
            "The associated keywords of the content for SEO optimization",
         ),
      metaDescription: z
         .string()
         .describe("The SEO optimized meta description of the content"),
   }).omit({
      competitorIds: true,
      organizationId: true,
   });

export const articleSeoOptimizationStep = createStep({
   description: "Generate SEO keywords and meta description for the article",
   execute: async ({ inputData }) => {
      try {
         const { agentId, userId, contentId, request, editor } = inputData;

         // Update content status and emit event when SEO optimization starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Optimizing SEO for your article...",
            status: "pending",
         });

         const keywords = getKeywordsFromText({
            minLength: 8,
            text: editor,
         });
         const metaDescription = createDescriptionFromText({
            maxLength: 180,
            text: editor,
         });

         // Update content status and emit event when SEO optimization completes
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "SEO optimization completed",
            status: "pending",
         });

         return {
            agentId,
            contentId,
            keywords,
            metaDescription,
            request,
            userId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            layout: inputData.request.layout,
            message: "Failed to optimize SEO for article",
            status: "failed",
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to optimize SEO for article");
      }
   },
   id: "article-seo-optimization-step",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: SeoOptimizationStepOutputSchema,
});

const FinalResultStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   editor: editorType,
   keywords: z
      .array(z.string())
      .describe("The associated keywords of the content"),
   metaDescription: z
      .string()
      .describe(
         "The meta description, being a SEO optimized description of the article",
      ),
   rating: z.number().min(0).max(100),
   reasonOfTheRating: z
      .string()
      .describe("The reason for the rating, written in markdown"),
   sources: z.array(z.string()).describe("The sources found on the search"),
}).omit({
   competitorIds: true,
   organizationId: true,
});

export const articleFinalResultStep = createStep({
   description: "Combine reader and SEO results into final output",
   execute: async ({ inputData }) => {
      const readerResult = inputData["article-read-and-review-step"];
      const seoResult = inputData["article-seo-optimization-step"];
      const { contentId, request } = readerResult;
      try {
         // Update content status and emit event when final result compilation starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Compiling final results...",
            status: "pending",
         });

         // Combine results - prioritize SEO keywords and meta description
         const finalResult = {
            agentId: readerResult.agentId,
            contentId: readerResult.contentId,
            editor: readerResult.editor,
            keywords: seoResult.keywords,
            metaDescription: seoResult.metaDescription,
            rating: readerResult.rating,
            reasonOfTheRating: readerResult.reasonOfTheRating,
            request: readerResult.request,
            sources: readerResult.sources,
            userId: readerResult.userId,
         };

         // Update content status and emit event when final result compilation completes

         return finalResult;
      } catch (error) {
         await updateContentStatus({
            contentId: contentId,
            layout: request.layout,
            message: "Failed to compile final results",
            status: "failed",
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to compile final results");
      }
   },
   id: "article-final-result-step",
   inputSchema: z.object({
      "article-read-and-review-step": ContentReviewerStepOutputSchema,
      "article-seo-optimization-step": SeoOptimizationStepOutputSchema,
   }),
   outputSchema: FinalResultStepOutputSchema,
});

export const createNewArticleWorkflow = createWorkflow({
   description: "Create a new article",
   id: "create-new-article-workflow",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: FinalResultStepOutputSchema,
})
   .parallel([researchStep, strategyStep])
   .then(articleWritingStep)
   .then(articleEditorStep)
   .parallel([articleReadAndReviewStep, articleSeoOptimizationStep])
   .then(articleFinalResultStep)
   .commit();

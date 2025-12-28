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

const tutorialWriterAgent = createWriterAgent("tutorial");
const tutorialEditorAgent = createEditorAgent("tutorial");
const tutorialReaderAgent = createReaderAgent("tutorial");

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
   .describe("The detailed tutorial draft, ready for editing");

const editorType = z.string().describe("The edited tutorial, ready for review");

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
         const { userId, request, agentId, contentId } = inputData;

         // Emit event when research starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Researching for your tutorial...",
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

         if (!result?.object.searchIntent) {
            throw AppError.validation(
               'Agent output is missing "searchIntent" field',
            );
         }

         // Emit event when research completes
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Tutorial research completed",
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
            message: "Failed to research tutorial",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to research tutorial: ${(error as Error).message}`,
         );
      }
   },
   id: "tutorial-research-step",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ResearchStepOutputSchema,
});

const tutorialWritingStep = createStep({
   description: "Write the tutorial based on the content strategy and research",
   execute: async ({ inputData, requestContext }) => {
      try {
         const {
            userId,
            request,
            competitorAnalysis,
            contentGaps,
            searchIntent,
            strategicRecommendations,
            sources,
            agentId,
            contentId,
         } = inputData;

         // Emit event when writing starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Writing your tutorial...",
            status: "pending",
         });

         const researchPrompt = `
searchIntent: ${searchIntent}
competitorAnalysis: ${competitorAnalysis}
contentGaps: ${contentGaps}
strategicRecommendations: ${strategicRecommendations}
`;

         const inputPrompt = `
create a new ${request.layout} based on the conent request.

request: ${request.description}

${researchPrompt}

`;
         const result = await tutorialWriterAgent.generate(
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
            message: "Tutorial draft completed",
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
         await updateContentStatus({
            contentId: inputData.contentId,
            layout: inputData.request.layout,
            message: "Failed to write tutorial",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to write tutorial: ${(error as Error).message}`,
         );
      }
   },
   id: "tutorial-writing-step",
   inputSchema: ResearchStepOutputSchema,
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
const tutorialEditorStep = createStep({
   description: "Edit the tutorial based on the content research",
   execute: async ({ inputData, requestContext }) => {
      try {
         const { userId, request, writing, agentId, contentId, sources } =
            inputData;

         // Emit event when editing starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Editing your tutorial...",
            status: "pending",
         });

         const inputPrompt = `
i need you to edit this ${request.layout} draft.

writing: ${writing}

output the edited content in markdown format.
`;
         const result = await tutorialEditorAgent.generate(
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
            message: "Tutorial editing completed",
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
            message: "Failed to edit tutorial",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to edit tutorial: ${(error as Error).message}`,
         );
      }
   },
   id: "tutorial-editor-step",
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
export const tutorialReadAndReviewStep = createStep({
   description: "Read and review the tutorial",
   execute: async ({ inputData, requestContext }) => {
      try {
         const { userId, request, editor, agentId, contentId, sources } =
            inputData;

         // Emit event when review starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Reviewing your tutorial...",
            status: "pending",
         });

         const inputPrompt = `
i need you to read and review this ${request.layout}.


original:${request.description}

final:${editor}

`;

         //TODO: Rework
         const result = await tutorialReaderAgent.generate(
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
            message: "Tutorial review completed",
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
            message: "Failed to review tutorial",
            status: "failed",
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to review tutorial: ${(error as Error).message}`,
         );
      }
   },
   id: "tutorial-read-and-review-step",
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

export const tutorialSeoOptimizationStep = createStep({
   description: "Generate SEO keywords and meta description for the tutorial",
   execute: async ({ inputData }) => {
      try {
         const { userId, agentId, contentId, request, editor } = inputData;

         // Update content status and emit event when SEO optimization starts
         await updateContentStatus({
            contentId,
            layout: request.layout,
            message: "Optimizing SEO for your tutorial...",
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
            message: "Failed to optimize SEO for tutorial",
            status: "failed",
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to optimize SEO for tutorial");
      }
   },
   id: "tutorial-seo-optimization-step",
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

export const tutorialFinalResultStep = createStep({
   description: "Combine reader and SEO results into final output",
   execute: async ({ inputData }) => {
      const readerResult = inputData["tutorial-read-and-review-step"];
      const seoResult = inputData["tutorial-seo-optimization-step"];
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
   id: "tutorial-final-result-step",
   inputSchema: z.object({
      "tutorial-read-and-review-step": ContentReviewerStepOutputSchema,
      "tutorial-seo-optimization-step": SeoOptimizationStepOutputSchema,
   }),
   outputSchema: FinalResultStepOutputSchema,
});

export const createNewTutorialWorkflow = createWorkflow({
   description: "Create a new tutorial",
   id: "create-new-tutorial-workflow",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: FinalResultStepOutputSchema,
})
   .then(researchStep)
   .then(tutorialWritingStep)
   .then(tutorialEditorStep)
   .parallel([tutorialReadAndReviewStep, tutorialSeoOptimizationStep])
   .then(tutorialFinalResultStep)
   .commit();

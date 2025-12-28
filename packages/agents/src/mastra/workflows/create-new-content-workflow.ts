import { createStep, createWorkflow } from "@mastra/core/workflows";
import { createDb } from "@packages/database/client";
import { updateContent } from "@packages/database/repositories/content-repository";
import {
   type ContentMeta,
   ContentRequestSchema,
   type ContentStats,
} from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { emitContentStatusChanged } from "@packages/server-events";
import { AppError, propagateError } from "@packages/utils/errors";
import {
   extractTitleFromMarkdown,
   removeTitleFromMarkdown,
} from "@packages/utils/markdown";
import {
   calculateReadTimeMinutes,
   countWords,
   createSlug,
} from "@packages/utils/text";
import { z } from "zod";
import { createNewArticleWorkflow } from "./content/create-new-article-workflow";
import { createNewChangelogWorkflow } from "./content/create-new-changelog-workflow";
import { createNewTutorialWorkflow } from "./content/create-new-tutorial-workflow";

const CreateNewContentWorkflowInputSchema = z.object({
   agentId: z.string(),
   competitorIds: z.array(z.string()),
   contentId: z.string(),
   organizationId: z.string(),
   request: ContentRequestSchema,
   userId: z.string(),
});

const type = CreateNewContentWorkflowInputSchema.extend({
   editor: z.string().describe("The edited article, ready for review"),
   keywords: z
      .array(z.string())
      .describe("The associeated keywords of the content"),
   metaDescription: z
      .string()
      .describe(
         "The meta description, being a SEO optmizaed description of the article",
      ),
   rating: z.number().min(0).max(100),
   reasonOfTheRating: z
      .string()
      .describe("The reason for the rating, written in markdown"),
   sources: z.array(z.string()).describe("The sources found on the search"),
});
const CreateNewContentWorkflowOutputSchema = z.object({
   "create-new-article-workflow": type,
   "create-new-changelog-workflow": type,
   "create-new-tutorial-workflow": type,
});

const saveContentStep = createStep({
   description: "Save the content to the database",
   execute: async ({ inputData }) => {
      const getWorkflowResult = (data: typeof inputData) => {
         const possibleKeys = [
            "create-new-changelog-workflow",
            "create-new-article-workflow",
            "create-new-tutorial-workflow",
         ] as const;

         for (const key of possibleKeys) {
            if (data[key]) {
               return data[key];
            }
         }

         throw AppError.validation("No workflow result found");
      };

      const workflowResult = getWorkflowResult(inputData);
      const {
         editor,
         keywords,
         metaDescription,
         rating,
         reasonOfTheRating,
         sources,
         agentId,
         contentId,
         request,
      } = workflowResult;

      const dbClient = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      try {
         const stats: ContentStats = {
            qualityScore: rating.toString(),
            readTimeMinutes: calculateReadTimeMinutes(
               countWords(editor),
            ).toString(),
            reasonOfTheRating,
            wordsCount: countWords(editor).toString(),
         };
         const meta: ContentMeta = {
            description: metaDescription,
            keywords,
            slug: createSlug(extractTitleFromMarkdown(editor)),
            sources,
            title: extractTitleFromMarkdown(editor),
         };
         await updateContent(dbClient, contentId, {
            agentId,
            body: removeTitleFromMarkdown(editor),
            meta,
            request,
            stats,
            status: "draft",
         });

         // Emit event when content is saved as draft
         emitContentStatusChanged({
            contentId,
            layout: request.layout,
            message: "Content generation completed and saved as draft",
            status: "draft",
         });

         return {
            success: true,
         };
      } catch (error) {
         // Emit event for UI but don't update DB status (failed is not a valid DB status)
         emitContentStatusChanged({
            contentId,
            layout: request.layout,
            message: "Failed to save your new content on the database",
            status: "failed",
         });

         console.error("Failed to save content:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to save content: ${(error as Error).message}`,
         );
      }
   },
   id: "save-content-step",
   inputSchema: CreateNewContentWorkflowOutputSchema,
   outputSchema: z.object({
      success: z.boolean(),
   }),
});

export const createNewContentWorkflow = createWorkflow({
   description: "Create a new piece of content",
   id: "create-new-content-workflow",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: CreateNewContentWorkflowOutputSchema,
})
   .branch([
      [
         async ({
            inputData: {
               request: { layout },
            },
         }) => layout === "tutorial",
         createNewTutorialWorkflow,
      ],
      [
         async ({
            inputData: {
               request: { layout },
            },
         }) => layout === "changelog",
         createNewChangelogWorkflow,
      ],
      [
         async ({
            inputData: {
               request: { layout },
            },
         }) => layout === "article",
         createNewArticleWorkflow,
      ],
   ])
   .then(saveContentStep)
   .commit();

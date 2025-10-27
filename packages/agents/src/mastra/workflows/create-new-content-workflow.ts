import { createWorkflow, createStep } from "@mastra/core";
import {
   countWords,
   createSlug,
   calculateReadTimeMinutes,
} from "@packages/utils/text";
import {
   extractTitleFromMarkdown,
   removeTitleFromMarkdown,
} from "@packages/utils/markdown";
import { updateContent } from "@packages/database/repositories/content-repository";
import { z } from "zod";
import {
   ContentRequestSchema,
   type ContentMeta,
   type ContentStats,
} from "@packages/database/schema";
import { createNewTutorialWorkflow } from "./content/create-new-tutorial-workflow";
import { createNewChangelogWorkflow } from "./content/create-new-changelog-workflow";
import { createNewArticleWorkflow } from "./content/create-new-article-workflow";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import { emitContentStatusChanged } from "@packages/server-events";
import { AppError, propagateError } from "@packages/utils/errors";

const CreateNewContentWorkflowInputSchema = z.object({
   userId: z.string(),
   competitorIds: z.array(z.string()),
   agentId: z.string(),
   contentId: z.string(),
   organizationId: z.string(),
   request: ContentRequestSchema,
});

const type = CreateNewContentWorkflowInputSchema.extend({
   rating: z.number().min(0).max(100),
   reasonOfTheRating: z
      .string()
      .describe("The reason for the rating, written in markdown"),
   editor: z.string().describe("The edited article, ready for review"),
   metaDescription: z
      .string()
      .describe(
         "The meta description, being a SEO optmizaed description of the article",
      ),
   keywords: z
      .array(z.string())
      .describe("The associeated keywords of the content"),
   sources: z.array(z.string()).describe("The sources found on the search"),
});
const CreateNewContentWorkflowOutputSchema = z.object({
   "create-new-changelog-workflow": type,
   "create-new-article-workflow": type,
   "create-new-tutorial-workflow": type,
});

const saveContentStep = createStep({
   id: "save-content-step",
   description: "Save the content to the database",
   inputSchema: CreateNewContentWorkflowOutputSchema,
   outputSchema: z.object({
      success: z.boolean(),
   }),
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
            wordsCount: countWords(editor).toString(),
            readTimeMinutes: calculateReadTimeMinutes(
               countWords(editor),
            ).toString(),
            qualityScore: rating.toString(),
            reasonOfTheRating,
         };
         const meta: ContentMeta = {
            title: extractTitleFromMarkdown(editor),
            slug: createSlug(extractTitleFromMarkdown(editor)),
            description: metaDescription,
            keywords,
            sources,
         };
         await updateContent(dbClient, contentId, {
            status: "draft",
            agentId,
            request,
            stats,
            meta,
            body: removeTitleFromMarkdown(editor),
         });

         // Emit event when content is saved as draft
         emitContentStatusChanged({
            contentId,
            status: "draft",
            message: "Content generation completed and saved as draft",
            layout: request.layout,
         });

         return {
            success: true,
         };
      } catch (error) {
         await updateContent(dbClient, contentId, {
            status: "failed",
         });

         emitContentStatusChanged({
            contentId,
            status: "failed",
            message: "Failed to save your new content on the database",
            layout: request.layout,
         });

         console.error("Failed to save content:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to save content: ${(error as Error).message}`,
         );
      }
   },
});

export const createNewContentWorkflow = createWorkflow({
   id: "create-new-content-workflow",
   description: "Create a new piece of content",
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

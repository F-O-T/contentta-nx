import { protectedProcedure, router } from "../trpc";
import {
   getAllVersionsByContentId,
   getNextVersionNumber,
   createContentVersion,
} from "@packages/database/repositories/content-version-repository";
import { hasContentAccess } from "@packages/database/repositories/access-control-repository";
import {
   getContentById,
   updateContent,
   updateContentCurrentVersion,
} from "@packages/database/repositories/content-repository";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { calculateTextStats } from "@packages/utils/text";
import { createDiff, createLineDiff } from "@packages/utils/diff";

export const contentVersionRouter = router({
   editBodyAndCreateNewVersion: protectedProcedure
      .input(
         z.object({
            id: z.uuid(),
            body: z.string(),
            baseVersion: z.number().optional(), // Optional version to compare against
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const db = (await ctx).db;
            if (!input.id || !input.body) {
               throw APIError.validation("Content ID and body are required.");
            }

            // Get the current content to calculate diff
            const currentContent = await getContentById(db, input.id);
            if (!currentContent) {
               throw APIError.notFound("Content not found.");
            }

            // Get the user ID
            const userId = (await ctx).session?.user.id;
            if (!userId) {
               throw APIError.unauthorized(
                  "User must be authenticated to edit content.",
               );
            }

            // Calculate diff from specified base version or latest version
            let diff = null;
            let lineDiff = null;
            const changedFields: string[] = [];

            try {
               let baseVersionBody = "";

               // For now, we'll use the current content as the base for comparison
               // TODO: Implement proper content reconstruction from diffs for historical comparison
               baseVersionBody = currentContent.body;

               diff = createDiff(baseVersionBody, input.body);
               lineDiff = createLineDiff(baseVersionBody, input.body);

               // Track which fields changed (only body in this case)
               if (input.body !== baseVersionBody) {
                  changedFields.push("body");
               }
            } catch (err) {
               console.error(err);
               propagateError(err);
               throw APIError.internal("Failed to create content");
            }

            // Get next version number
            const versionNumber = await getNextVersionNumber(db, input.id);

            // Create new version
            await createContentVersion(db, {
               contentId: input.id,
               userId,
               version: versionNumber,
               meta: {
                  diff: diff,
                  lineDiff: lineDiff,
                  changedFields,
               },
            });

            // Update the content's current version
            await updateContentCurrentVersion(db, input.id, versionNumber);

            // Calculate new stats for the updated content
            const newStats = calculateTextStats(input.body);

            // Merge existing stats with new stats, preserving existing values unless new ones should override
            const updatedStats = {
               ...currentContent.stats,
               ...newStats,
               qualityScore: currentContent.stats?.qualityScore,
            };

            // Update the content
            const updated = await updateContent(db, input.id, {
               body: input.body,
               stats: updatedStats,
            });

            return { success: true, content: updated, version: versionNumber };
         } catch (err) {
            propagateError(err);
            throw APIError.internal(
               "Failed to edit content and create version",
            );
         }
      }),
   getVersions: protectedProcedure
      .input(z.object({ contentId: z.string() }))
      .query(async ({ ctx, input }) => {
         try {
            if (!input.contentId) {
               throw APIError.validation("Content ID is required.");
            }

            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw APIError.unauthorized(
                  "User must be authenticated to view versions.",
               );
            }

            // Check if user can access this content
            const content = await getContentById(
               resolvedCtx.db,
               input.contentId,
            );
            if (!content) {
               throw APIError.notFound("Content not found.");
            }

            const { canRead } = await hasContentAccess(
               resolvedCtx.db,
               content,
               userId,
               organizationId ?? "",
            );

            if (!canRead) {
               throw APIError.forbidden(
                  "You don't have permission to view versions for this content.",
               );
            }

            const versions = await getAllVersionsByContentId(
               resolvedCtx.db,
               input.contentId,
            );
            return versions;
         } catch (err) {
            propagateError(err);
            throw APIError.internal("Failed to fetch content versions");
         }
      }),
});

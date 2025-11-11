import { on } from "node:events";
import {
   deleteFeaturesByBrandId,
   getFeaturesByBrandId,
   getTotalFeaturesByBrandId,
} from "@packages/database/repositories/brand-feature-repository";
import {
   createBrand,
   deleteBrand,
   getBrandById,
   getBrandByOrgId,
   updateBrand,
} from "@packages/database/repositories/brand-repository";
import { BrandInsertSchema } from "@packages/database/schema";
import {
   type BrandStatusChangedPayload,
   EVENTS,
   eventEmitter,
} from "@packages/server-events";
import { APIError, propagateError } from "@packages/utils/errors";
import { enqueueCreateCompleteKnowledgeWorkflowJob } from "@packages/workers/queues/create-complete-knowledge-workflow-queue";
import { enqueueCreateFeaturesKnowledgeJob } from "@packages/workers/queues/create-features-knowledge-queue";
import { z } from "zod";
import {
   hasGenerationCredits,
   organizationOwnerProcedure,
   organizationProcedure,
   protectedProcedure,
   publicProcedure,
   router,
} from "../trpc";

export const brandRouter = router({
   analyze: organizationProcedure
      .use(hasGenerationCredits)

      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to analyze brands.",
               );
            }

            const brand = await getBrandById(resolvedCtx.db, input.id);

            // Verify the brand belongs to the organization
            if (brand.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to analyze this brand.",
               );
            }

            await deleteFeaturesByBrandId(resolvedCtx.db, brand.id);

            if (!brand.websiteUrl) {
               throw APIError.validation(
                  "Website URL is required to analyze a brand.",
               );
            }
            await enqueueCreateFeaturesKnowledgeJob({
               id: brand.id,
               target: "brand",
               userId,
               websiteUrl: brand.websiteUrl,
            });
            return { success: true };
         } catch (err) {
            console.error("Error analyzing brand:", err);
            propagateError(err);
            throw APIError.internal("Failed to analyze brand.");
         }
      }),
   create: organizationOwnerProcedure
      .use(hasGenerationCredits)
      .input(
         BrandInsertSchema.pick({
            websiteUrl: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to create brands.",
               );
            }

            const created = await createBrand(resolvedCtx.db, {
               ...input,
               organizationId,
            });
            if (!input.websiteUrl) {
               throw APIError.validation(
                  "Website URL is required to create a brand.",
               );
            }

            await enqueueCreateCompleteKnowledgeWorkflowJob({
               id: created.id,
               runtimeContext: {
                  language: resolvedCtx.language,
                  userId,
               },
               target: "brand",
               userId,
               websiteUrl: input.websiteUrl,
            });

            return created;
         } catch (err) {
            console.error("Error creating brand:", err);
            propagateError(err);
            throw APIError.internal("Failed to create brand.");
         }
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to delete brands.",
               );
            }

            // Verify the brand exists and belongs to the organization
            const existing = await getBrandById(resolvedCtx.db, input.id);
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to delete this brand.",
               );
            }

            await deleteBrand(resolvedCtx.db, input.id);
            return { success: true };
         } catch (err) {
            console.error("Error deleting brand:", err);
            propagateError(err);
            throw APIError.internal("Failed to delete brand.");
         }
      }),

   get: protectedProcedure
      .input(z.object({ id: z.uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to view brands.",
               );
            }

            const brand = await getBrandById(resolvedCtx.db, input.id);

            // Verify the brand belongs to the organization
            if (brand.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this brand.",
               );
            }

            return brand;
         } catch (err) {
            console.error("Error getting brand:", err);
            propagateError(err);
            throw APIError.internal("Failed to get brand.");
         }
      }),

   getByOrganization: protectedProcedure.query(async ({ ctx }) => {
      try {
         const resolvedCtx = await ctx;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;

         if (!organizationId) {
            throw APIError.unauthorized(
               "User must be authenticated and belong to an organization to view brands.",
            );
         }

         let brand: Awaited<ReturnType<typeof getBrandByOrgId>> | null = null;
         try {
            brand = await getBrandByOrgId(resolvedCtx.db, organizationId);
         } catch (err) {
            if (
               !(
                  err instanceof Error &&
                  err.message.includes("Brand not found")
               )
            ) {
               throw err;
            }
         }
         return brand;
      } catch (err) {
         console.error("Error getting organization brand:", err);
         propagateError(err);
         throw APIError.internal("Failed to get organization brand.");
      }
   }),

   getFeatures: protectedProcedure
      .input(
         z.object({
            brandId: z.uuid(),
            limit: z.number().min(1).max(100).optional().default(12),
            page: z.number().min(1).optional().default(1),
            sortBy: z
               .enum(["extractedAt", "featureName"])
               .optional()
               .default("extractedAt"),
            sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to view brand features.",
               );
            }

            // Verify the brand exists and belongs to the organization
            const brand = await getBrandById(resolvedCtx.db, input.brandId);
            if (brand.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this brand's features.",
               );
            }

            const [features, total] = await Promise.all([
               getFeaturesByBrandId(resolvedCtx.db, input.brandId, {
                  limit: input.limit,
                  page: input.page,
                  sortBy: input.sortBy,
                  sortOrder: input.sortOrder,
               }),
               getTotalFeaturesByBrandId(resolvedCtx.db, input.brandId),
            ]);

            const totalPages = Math.ceil(total / input.limit);

            return {
               features,
               limit: input.limit,
               page: input.page,
               total,
               totalPages,
            };
         } catch (err) {
            console.error("Error getting brand features:", err);
            propagateError(err);
            throw APIError.internal("Failed to get brand features.");
         }
      }),
   list: protectedProcedure
      .input(
         z.object({
            limit: z.number().min(1).max(100).optional().default(20),
            page: z.number().min(1).optional().default(1),
            search: z.string().optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const brand = await getBrandByOrgId(resolvedCtx.db, organizationId);

            if (!brand) {
               throw APIError.notFound("Brand not found.");
            }

            const total = brand ? 1 : 0;

            return {
               items: brand ? [brand] : [],
               limit: input.limit,
               page: input.page,
               total,
            };
         } catch (err) {
            console.error("Error listing brands:", err);
            propagateError(err);
            throw APIError.internal("Failed to list brands.");
         }
      }),
   onStatusChange: publicProcedure
      .input(z.object({ brandId: z.string().optional() }).optional())
      .subscription(async function* (opts) {
         for await (const [payload] of on(eventEmitter, EVENTS.brandStatus, {
            signal: opts.signal,
         })) {
            const event = payload as BrandStatusChangedPayload;
            if (!opts.input?.brandId || opts.input.brandId === event.brandId) {
               yield event;
            }
         }
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: BrandInsertSchema.pick({
               description: true,
               industry: true,
               name: true,
               websiteUrl: true,
            }).partial(),
            id: z.uuid(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to update brands.",
               );
            }

            // Verify the brand exists and belongs to the organization
            const existing = await getBrandById(resolvedCtx.db, input.id);
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this brand.",
               );
            }

            const updated = await updateBrand(
               resolvedCtx.db,
               input.id,
               input.data,
            );
            return updated;
         } catch (err) {
            console.error("Error updating brand:", err);
            propagateError(err);
            throw APIError.internal("Failed to update brand.");
         }
      }),
});

import {
	createBrand,
	deleteBrand,
	getBrandById,
	getBrandByOrgId,
	updateBrand,
} from "@packages/database/repositories/brand-repository";
import { BrandInsertSchema } from "@packages/database/schema";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import {
	hasGenerationCredits,
	organizationOwnerProcedure,
	organizationProcedure,
	protectedProcedure,
	router,
} from "../trpc";

export const brandRouter = router({
	analyze: organizationProcedure
		.use(hasGenerationCredits)
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to analyze brands.",
					);
				}

				const brand = await getBrandById(resolvedCtx.db, input.id);
				if (!brand) {
					throw APIError.notFound("Brand not found.");
				}

				if (brand.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to analyze this brand.",
					);
				}

				if (!brand.websiteUrl) {
					throw APIError.validation(
						"Website URL is required to analyze a brand.",
					);
				}

				// TODO: Implement brand analysis with new agent architecture
				await updateBrand(resolvedCtx.db, brand.id, { status: "analyzing" });

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
				name: true,
				websiteUrl: true,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to create brands.",
					);
				}

				if (!input.websiteUrl) {
					throw APIError.validation(
						"Website URL is required to create a brand.",
					);
				}

				const created = await createBrand(resolvedCtx.db, {
					...input,
					organizationId,
				});

				if (!created) {
					throw APIError.internal("Failed to create brand.");
				}

				return created;
			} catch (err) {
				console.error("Error creating brand:", err);
				propagateError(err);
				throw APIError.internal("Failed to create brand.");
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to delete brands.",
					);
				}

				const existing = await getBrandById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Brand not found.");
				}
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
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to view brands.",
					);
				}

				const brand = await getBrandById(resolvedCtx.db, input.id);
				if (!brand) {
					throw APIError.notFound("Brand not found.");
				}

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
			const organizationId = resolvedCtx.organizationId;

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
					!(err instanceof Error && err.message.includes("Brand not found"))
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
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				let brand: Awaited<ReturnType<typeof getBrandByOrgId>> | null = null;
				try {
					brand = await getBrandByOrgId(resolvedCtx.db, organizationId);
				} catch {
					// Brand not found
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

	update: protectedProcedure
		.input(
			z.object({
				data: BrandInsertSchema.pick({
					websiteUrl: true,
				}).partial(),
				id: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to update brands.",
					);
				}

				const existing = await getBrandById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Brand not found.");
				}
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

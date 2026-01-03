import {
	getAgentById,
	getAgentsByOrganizationId,
} from "@packages/database/repositories/agent-repository";
import {
	archiveContent,
	createContent,
	deleteContent,
	getContentById,
	getContentsByAgentId,
	publishContent,
	updateContent,
} from "@packages/database/repositories/content-repository";
import {
	ContentMetaSchema,
	ContentRequestSchema,
} from "@packages/database/schema";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const contentRouter = router({
	listAllContent: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).optional().default(20),
				page: z.number().min(1).optional().default(1),
				status: z
					.array(z.enum(["draft", "published", "archived"]))
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const resolvedCtx = await ctx;
			const organizationId = resolvedCtx.organizationId;

			if (!organizationId) {
				throw APIError.unauthorized("Organization must be specified.");
			}

			// Get all agents for this organization
			const agents = await getAgentsByOrganizationId(
				resolvedCtx.db,
				organizationId,
			);

			if (!agents.length) {
				return {
					items: [],
					limit: input.limit,
					page: input.page,
					total: 0,
					totalPages: 0,
				};
			}

			// Get content from all agents
			const allContent = await Promise.all(
				agents.map((agent) =>
					getContentsByAgentId(resolvedCtx.db, agent.id),
				),
			);

			// Flatten and filter by status
			let items = allContent.flat();

			if (input.status && input.status.length > 0) {
				items = items.filter((item) =>
					input.status!.includes(item.status as "draft" | "published" | "archived"),
				);
			}

			// Sort by createdAt descending
			items.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);

			// Paginate
			const total = items.length;
			const totalPages = Math.ceil(total / input.limit);
			const start = (input.page - 1) * input.limit;
			const end = start + input.limit;
			const paginatedItems = items.slice(start, end);

			return {
				items: paginatedItems,
				limit: input.limit,
				page: input.page,
				total,
				totalPages,
			};
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const resolvedCtx = await ctx;
			const organizationId = resolvedCtx.organizationId;

			if (!organizationId) {
				throw APIError.unauthorized("Organization must be specified.");
			}

			const content = await getContentById(resolvedCtx.db, input.id);

			if (!content) {
				throw APIError.notFound("Content not found.");
			}

			// Get agent info for this content
			const agent = await getAgentById(resolvedCtx.db, content.agentId);

			return {
				...content,
				agent: agent
					? {
							id: agent.id,
							name: agent.personaConfig.metadata.name,
							profilePhotoUrl: agent.profilePhotoUrl,
						}
					: null,
			};
		}),

	getByAgentId: protectedProcedure
		.input(
			z.object({
				agentId: z.string().uuid(),
				limit: z.number().min(1).max(100).optional().default(20),
				page: z.number().min(1).optional().default(1),
				status: z
					.array(z.enum(["draft", "published", "archived"]))
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				// Verify agent belongs to organization
				const agent = await getAgentById(resolvedCtx.db, input.agentId);
				if (!agent) {
					throw APIError.notFound("Writer not found.");
				}
				if (agent.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to view this writer's content.",
					);
				}

				const contents = await getContentsByAgentId(
					resolvedCtx.db,
					input.agentId,
				);

				// Filter by status
				let filteredContents = contents;
				if (input.status && input.status.length > 0) {
					filteredContents = contents.filter((item) =>
						input.status!.includes(
							item.status as "draft" | "published" | "archived",
						),
					);
				}

				// Paginate
				const total = filteredContents.length;
				const totalPages = Math.ceil(total / input.limit);
				const start = (input.page - 1) * input.limit;
				const end = start + input.limit;
				const paginatedItems = filteredContents.slice(start, end);

				return {
					items: paginatedItems,
					limit: input.limit,
					page: input.page,
					total,
					totalPages,
				};
			} catch (err) {
				console.error("Error getting content by agent:", err);
				propagateError(err);
				throw APIError.internal("Failed to get content.");
			}
		}),

	create: protectedProcedure
		.input(
			z.object({
				agentId: z.string().uuid(),
				body: z.string().optional().default(""),
				meta: ContentMetaSchema,
				request: ContentRequestSchema.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;
				const memberId = resolvedCtx.memberId;

				if (!organizationId || !memberId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization.",
					);
				}

				// Verify agent belongs to organization
				const agent = await getAgentById(resolvedCtx.db, input.agentId);
				if (!agent) {
					throw APIError.notFound("Writer not found.");
				}
				if (agent.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to create content for this writer.",
					);
				}

				const created = await createContent(resolvedCtx.db, {
					agentId: input.agentId,
					body: input.body,
					createdByMemberId: memberId,
					meta: input.meta,
					request: input.request,
				});

				return created;
			} catch (err) {
				console.error("Error creating content:", err);
				propagateError(err);
				throw APIError.internal("Failed to create content.");
			}
		}),

	update: protectedProcedure
		.input(
			z.object({
				data: z.object({
					body: z.string().optional(),
					meta: ContentMetaSchema.partial().optional(),
				}),
				id: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				const existing = await getContentById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Content not found.");
				}

				// Verify agent belongs to organization
				const agent = await getAgentById(resolvedCtx.db, existing.agentId);
				if (!agent || agent.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to update this content.",
					);
				}

				const updateData: Parameters<typeof updateContent>[2] = {};
				if (input.data.body !== undefined) {
					updateData.body = input.data.body;
				}
				if (input.data.meta) {
					updateData.meta = {
						...existing.meta,
						...input.data.meta,
					};
				}

				const updated = await updateContent(
					resolvedCtx.db,
					input.id,
					updateData,
				);
				return updated;
			} catch (err) {
				console.error("Error updating content:", err);
				propagateError(err);
				throw APIError.internal("Failed to update content.");
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				const existing = await getContentById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Content not found.");
				}

				// Verify agent belongs to organization
				const agent = await getAgentById(resolvedCtx.db, existing.agentId);
				if (!agent || agent.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to delete this content.",
					);
				}

				await deleteContent(resolvedCtx.db, input.id);
				return { success: true };
			} catch (err) {
				console.error("Error deleting content:", err);
				propagateError(err);
				throw APIError.internal("Failed to delete content.");
			}
		}),

	publish: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				const existing = await getContentById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Content not found.");
				}

				// Verify agent belongs to organization
				const agent = await getAgentById(resolvedCtx.db, existing.agentId);
				if (!agent || agent.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to publish this content.",
					);
				}

				const published = await publishContent(resolvedCtx.db, input.id);
				return published;
			} catch (err) {
				console.error("Error publishing content:", err);
				propagateError(err);
				throw APIError.internal("Failed to publish content.");
			}
		}),

	archive: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				const existing = await getContentById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Content not found.");
				}

				// Verify agent belongs to organization
				const agent = await getAgentById(resolvedCtx.db, existing.agentId);
				if (!agent || agent.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to archive this content.",
					);
				}

				const archived = await archiveContent(resolvedCtx.db, input.id);
				return archived;
			} catch (err) {
				console.error("Error archiving content:", err);
				propagateError(err);
				throw APIError.internal("Failed to archive content.");
			}
		}),
});

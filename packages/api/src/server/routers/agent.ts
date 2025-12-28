import {
	createAgent,
	deleteAgent,
	getAgentById,
	getAgentsByOrganizationId,
	updateAgent,
} from "@packages/database/repositories/agent-repository";
import { getContentsByAgentId } from "@packages/database/repositories/content-repository";
import { PersonaConfigSchema } from "@packages/database/schema";
import {
	deleteFile,
	generatePresignedPutUrl,
	verifyFileExists,
} from "@packages/files/client";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const ALLOWED_PHOTO_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

export const agentRouter = router({
	create: protectedProcedure
		.input(
			z.object({
				personaConfig: PersonaConfigSchema,
				profilePhotoUrl: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to create writers.",
					);
				}

				const created = await createAgent(resolvedCtx.db, {
					organizationId,
					personaConfig: input.personaConfig,
					profilePhotoUrl: input.profilePhotoUrl,
				});

				if (!created) {
					throw APIError.internal("Failed to create writer.");
				}

				return created;
			} catch (err) {
				console.error("Error creating writer:", err);
				propagateError(err);
				throw APIError.internal("Failed to create writer.");
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
						"User must be authenticated and belong to an organization to delete writers.",
					);
				}

				const existing = await getAgentById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Writer not found.");
				}
				if (existing.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to delete this writer.",
					);
				}

				await deleteAgent(resolvedCtx.db, input.id);
				return { success: true };
			} catch (err) {
				console.error("Error deleting writer:", err);
				propagateError(err);
				throw APIError.internal("Failed to delete writer.");
			}
		}),

	duplicate: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to duplicate writers.",
					);
				}

				const existing = await getAgentById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Writer not found.");
				}
				if (existing.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to duplicate this writer.",
					);
				}

				const duplicatedConfig = {
					...existing.personaConfig,
					metadata: {
						...existing.personaConfig.metadata,
						name: `${existing.personaConfig.metadata.name} (Copy)`,
					},
				};

				const created = await createAgent(resolvedCtx.db, {
					organizationId,
					personaConfig: duplicatedConfig,
					profilePhotoUrl: existing.profilePhotoUrl ?? undefined,
				});

				if (!created) {
					throw APIError.internal("Failed to duplicate writer.");
				}

				return created;
			} catch (err) {
				console.error("Error duplicating writer:", err);
				propagateError(err);
				throw APIError.internal("Failed to duplicate writer.");
			}
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to view writers.",
					);
				}

				const agent = await getAgentById(resolvedCtx.db, input.id);
				if (!agent) {
					throw APIError.notFound("Writer not found.");
				}

				if (agent.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to view this writer.",
					);
				}

				// Get content count for this agent
				const contents = await getContentsByAgentId(resolvedCtx.db, input.id);
				const contentCount = contents.length;

				return {
					...agent,
					contentCount,
				};
			} catch (err) {
				console.error("Error getting writer:", err);
				propagateError(err);
				throw APIError.internal("Failed to get writer.");
			}
		}),

	getStats: protectedProcedure.query(async ({ ctx }) => {
		try {
			const resolvedCtx = await ctx;
			const organizationId = resolvedCtx.organizationId;

			if (!organizationId) {
				throw APIError.unauthorized("Organization must be specified.");
			}

			const agents = await getAgentsByOrganizationId(
				resolvedCtx.db,
				organizationId,
			);

			// Get content counts for each agent
			const agentsWithCounts = await Promise.all(
				agents.map(async (agent) => {
					const contents = await getContentsByAgentId(resolvedCtx.db, agent.id);
					return {
						agent,
						contentCount: contents.length,
					};
				}),
			);

			const totalAgents = agents.length;
			const totalContent = agentsWithCounts.reduce(
				(sum, item) => sum + item.contentCount,
				0,
			);

			// Find the most active agent (most content)
			const mostActiveAgent =
				agentsWithCounts.length > 0
					? agentsWithCounts.reduce((max, item) =>
							item.contentCount > max.contentCount ? item : max,
						)
					: null;

			return {
				mostActiveAgent: mostActiveAgent
					? {
							contentCount: mostActiveAgent.contentCount,
							id: mostActiveAgent.agent.id,
							name: mostActiveAgent.agent.personaConfig.metadata.name,
							profilePhotoUrl: mostActiveAgent.agent.profilePhotoUrl,
						}
					: null,
				totalAgents,
				totalContent,
			};
		} catch (err) {
			console.error("Error getting writer stats:", err);
			propagateError(err);
			throw APIError.internal("Failed to get writer stats.");
		}
	}),

	requestPhotoUploadUrl: protectedProcedure
		.input(
			z.object({
				agentId: z.string().uuid(),
				contentType: z.string().refine(
					(val) => ALLOWED_PHOTO_TYPES.includes(val),
					{ message: "File type must be JPEG, PNG, WebP, or AVIF" },
				),
				fileName: z.string(),
				fileSize: z
					.number()
					.max(MAX_PHOTO_SIZE, "File size must be less than 5MB"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				// Verify the agent exists and belongs to this organization
				const existing = await getAgentById(resolvedCtx.db, input.agentId);
				if (!existing) {
					throw APIError.notFound("Writer not found.");
				}
				if (existing.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to update this writer.",
					);
				}

				const timestamp = Date.now();
				const storageKey = `organizations/${organizationId}/agents/${input.agentId}/photo/${timestamp}-${input.fileName}`;

				const presignedUrl = await generatePresignedPutUrl(
					storageKey,
					resolvedCtx.minioBucket,
					resolvedCtx.minioClient,
					300, // 5 minutes
				);

				return {
					contentType: input.contentType,
					fileSize: input.fileSize,
					presignedUrl,
					storageKey,
				};
			} catch (err) {
				console.error("Error requesting photo upload URL:", err);
				propagateError(err);
				throw APIError.internal("Failed to request photo upload URL.");
			}
		}),

	cancelPhotoUpload: protectedProcedure
		.input(z.object({ storageKey: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				// Verify the storage key belongs to this organization
				if (!input.storageKey.startsWith(`organizations/${organizationId}/`)) {
					throw APIError.forbidden("Invalid storage key for this organization");
				}

				await deleteFile(
					input.storageKey,
					resolvedCtx.minioBucket,
					resolvedCtx.minioClient,
				);

				return { success: true };
			} catch (err) {
				console.error("Error canceling photo upload:", err);
				propagateError(err);
				throw APIError.internal("Failed to cancel photo upload.");
			}
		}),

	confirmPhotoUpload: protectedProcedure
		.input(
			z.object({
				agentId: z.string().uuid(),
				storageKey: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized("Organization must be specified.");
				}

				// Verify the storage key belongs to this organization
				if (!input.storageKey.startsWith(`organizations/${organizationId}/`)) {
					throw APIError.forbidden("Invalid storage key for this organization");
				}

				// Verify the agent exists and belongs to this organization
				const existing = await getAgentById(resolvedCtx.db, input.agentId);
				if (!existing) {
					throw APIError.notFound("Writer not found.");
				}
				if (existing.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to update this writer.",
					);
				}

				// Verify the file was uploaded
				const fileInfo = await verifyFileExists(
					input.storageKey,
					resolvedCtx.minioBucket,
					resolvedCtx.minioClient,
				);

				if (!fileInfo) {
					throw APIError.validation("File was not uploaded successfully");
				}

				// Delete old photo if it exists
				if (
					existing.profilePhotoUrl &&
					existing.profilePhotoUrl !== input.storageKey
				) {
					try {
						await deleteFile(
							existing.profilePhotoUrl,
							resolvedCtx.minioBucket,
							resolvedCtx.minioClient,
						);
					} catch (error) {
						console.error("Error deleting old photo:", error);
					}
				}

				// Update agent with new photo
				const updated = await updateAgent(resolvedCtx.db, input.agentId, {
					profilePhotoUrl: input.storageKey,
				});

				return updated;
			} catch (err) {
				console.error("Error confirming photo upload:", err);
				propagateError(err);
				throw APIError.internal("Failed to confirm photo upload.");
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

				const agents = await getAgentsByOrganizationId(
					resolvedCtx.db,
					organizationId,
				);

				// Filter by search if provided
				let filteredAgents = agents;
				if (input.search) {
					const searchLower = input.search.toLowerCase();
					filteredAgents = agents.filter(
						(agent) =>
							agent.personaConfig.metadata.name
								.toLowerCase()
								.includes(searchLower) ||
							agent.personaConfig.metadata.description
								?.toLowerCase()
								.includes(searchLower),
					);
				}

				// Paginate
				const total = filteredAgents.length;
				const totalPages = Math.ceil(total / input.limit);
				const start = (input.page - 1) * input.limit;
				const end = start + input.limit;
				const paginatedAgents = filteredAgents.slice(start, end);

				// Get content counts for each agent
				const agentsWithCounts = await Promise.all(
					paginatedAgents.map(async (agent) => {
						const contents = await getContentsByAgentId(
							resolvedCtx.db,
							agent.id,
						);
						return {
							...agent,
							contentCount: contents.length,
						};
					}),
				);

				return {
					items: agentsWithCounts,
					limit: input.limit,
					page: input.page,
					total,
					totalPages,
				};
			} catch (err) {
				console.error("Error listing writers:", err);
				propagateError(err);
				throw APIError.internal("Failed to list writers.");
			}
		}),

	update: protectedProcedure
		.input(
			z.object({
				data: z.object({
					personaConfig: PersonaConfigSchema.optional(),
					profilePhotoUrl: z.string().optional().nullable(),
				}),
				id: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const resolvedCtx = await ctx;
				const organizationId = resolvedCtx.organizationId;

				if (!organizationId) {
					throw APIError.unauthorized(
						"User must be authenticated and belong to an organization to update writers.",
					);
				}

				const existing = await getAgentById(resolvedCtx.db, input.id);
				if (!existing) {
					throw APIError.notFound("Writer not found.");
				}
				if (existing.organizationId !== organizationId) {
					throw APIError.forbidden(
						"You don't have permission to update this writer.",
					);
				}

				const updateData: Parameters<typeof updateAgent>[2] = {};
				if (input.data.personaConfig) {
					updateData.personaConfig = input.data.personaConfig;
				}
				if (input.data.profilePhotoUrl !== undefined) {
					updateData.profilePhotoUrl = input.data.profilePhotoUrl ?? undefined;
				}

				const updated = await updateAgent(
					resolvedCtx.db,
					input.id,
					updateData,
				);
				return updated;
			} catch (err) {
				console.error("Error updating writer:", err);
				propagateError(err);
				throw APIError.internal("Failed to update writer.");
			}
		}),
});

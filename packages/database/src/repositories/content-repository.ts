import { AppError, propagateError } from "@packages/utils/errors";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { content, type ContentInsert, type ContentStatus } from "../schemas/content";

export async function createContent(
	dbClient: DatabaseInstance,
	data: ContentInsert,
) {
	try {
		const result = await dbClient.insert(content).values(data).returning();
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to create content: ${(err as Error).message}`,
		);
	}
}

export async function getContentById(
	dbClient: DatabaseInstance,
	contentId: string,
) {
	try {
		const result = await dbClient.query.content.findFirst({
			where: (content, { eq }) => eq(content.id, contentId),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get content: ${(err as Error).message}`,
		);
	}
}

export async function getContentBySlug(
	dbClient: DatabaseInstance,
	slug: string,
	agentId: string,
) {
	try {
		const result = await dbClient.query.content.findFirst({
			where: (content, { eq, and }) =>
				and(
					eq(content.agentId, agentId),
					sql`${content.meta}->>'slug' = ${slug}`,
				),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get content by slug: ${(err as Error).message}`,
		);
	}
}

export async function getContentsByAgentId(
	dbClient: DatabaseInstance,
	agentId: string,
	status?: string,
) {
	try {
		const result = await dbClient.query.content.findMany({
			where: (content, { eq, and }) => {
				if (status) {
					return and(
						eq(content.agentId, agentId),
						sql`${content.status} = ${status}`,
					);
				}
				return eq(content.agentId, agentId);
			},
			orderBy: (content, { desc }) => desc(content.createdAt),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get contents: ${(err as Error).message}`,
		);
	}
}

export async function updateContent(
	dbClient: DatabaseInstance,
	contentId: string,
	data: Partial<ContentInsert>,
) {
	try {
		const result = await dbClient
			.update(content)
			.set(data)
			.where(eq(content.id, contentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Content not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to update content: ${(err as Error).message}`,
		);
	}
}

export async function updateContentCurrentVersion(
	dbClient: DatabaseInstance,
	contentId: string,
	version: number,
) {
	try {
		const result = await dbClient
			.update(content)
			.set({ currentVersion: version })
			.where(eq(content.id, contentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Content not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to update content version: ${(err as Error).message}`,
		);
	}
}

export async function deleteContent(
	dbClient: DatabaseInstance,
	contentId: string,
) {
	try {
		const result = await dbClient
			.delete(content)
			.where(eq(content.id, contentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Content not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to delete content: ${(err as Error).message}`,
		);
	}
}

export async function deleteBulkContent(
	dbClient: DatabaseInstance,
	contentIds: string[],
) {
	try {
		const result = await dbClient
			.delete(content)
			.where(inArray(content.id, contentIds))
			.returning();

		return { count: result.length };
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to delete bulk content: ${(err as Error).message}`,
		);
	}
}

export async function publishContent(
	dbClient: DatabaseInstance,
	contentId: string,
) {
	try {
		const result = await dbClient
			.update(content)
			.set({ status: "published" })
			.where(eq(content.id, contentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Content not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to publish content: ${(err as Error).message}`,
		);
	}
}

export async function archiveContent(
	dbClient: DatabaseInstance,
	contentId: string,
) {
	try {
		const result = await dbClient
			.update(content)
			.set({ status: "archived" })
			.where(eq(content.id, contentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Content not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to archive content: ${(err as Error).message}`,
		);
	}
}

export async function updateAIAssistantStats(
	dbClient: DatabaseInstance,
	contentId: string,
	statsUpdate: { completions?: number; edits?: number; suggestions?: number },
) {
	try {
		const existing = await getContentById(dbClient, contentId);
		if (!existing) {
			throw AppError.database("Content not found");
		}

		const currentStats = existing.aiAssistantStats || {
			completions: 0,
			edits: 0,
			suggestions: 0,
		};

		const newStats = {
			completions:
				(currentStats.completions || 0) + (statsUpdate.completions || 0),
			edits: (currentStats.edits || 0) + (statsUpdate.edits || 0),
			suggestions:
				(currentStats.suggestions || 0) + (statsUpdate.suggestions || 0),
			lastUsedAt: new Date().toISOString(),
		};

		const result = await dbClient
			.update(content)
			.set({ aiAssistantStats: newStats })
			.where(eq(content.id, contentId))
			.returning();

		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to update AI assistant stats: ${(err as Error).message}`,
		);
	}
}

export async function listContents(
	dbClient: DatabaseInstance,
	agentIds: string[],
	statuses?: string[],
) {
	try {
		const conditions = [inArray(content.agentId, agentIds)];

		if (statuses && statuses.length > 0) {
			conditions.push(inArray(content.status, statuses as ContentStatus[]));
		}

		const result = await dbClient
			.select()
			.from(content)
			.where(and(...conditions))
			.orderBy(desc(content.createdAt));

		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to list contents: ${(err as Error).message}`,
		);
	}
}

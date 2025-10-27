import { content } from "../schemas/content";
import { inArray } from "drizzle-orm";

import type {
   ContentSelect as Content,
   ContentInsert,
} from "../schemas/content";
import type { DatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";
import { eq, and, or, sql } from "drizzle-orm";

// Get content by slug
export async function getContentBySlug(
   dbClient: DatabaseInstance,
   slug: string,
   agentId: string,
) {
   try {
      // Find by meta.slug and agentId
      const result = await dbClient.query.content.findFirst({
         where: (fields, { sql, and }) =>
            and(
               sql`${fields.meta}->>'slug' = ${slug}`,
               sql`${fields.agentId} = ${agentId}`,
            ),
      });
      if (!result) throw AppError.database("Content not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content by slug and agentId: ${(err as Error).message}`,
      );
   }
}

export async function createContent(
   dbClient: DatabaseInstance,
   data: ContentInsert,
): Promise<Content> {
   try {
      const result = await dbClient.insert(content).values(data).returning();
      const created = result?.[0];
      if (!created) throw AppError.database("Content not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create content: ${(err as Error).message}`,
      );
   }
}

export async function getContentById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<Content> {
   try {
      const result = await dbClient.query.content.findFirst({
         where: eq(content.id, id),
      });
      if (!result) throw AppError.database("Content not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get content: ${(err as Error).message}`,
      );
   }
}

export async function updateContent(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<ContentInsert>,
): Promise<Content> {
   try {
      const result = await dbClient
         .update(content)
         .set(data)
         .where(eq(content.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Content not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update content: ${(err as Error).message}`,
      );
   }
}

export async function updateContentCurrentVersion(
   dbClient: DatabaseInstance,
   id: string,
   version: number,
): Promise<Content> {
   try {
      const result = await dbClient
         .update(content)
         .set({ currentVersion: version })
         .where(eq(content.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Content not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update content current version: ${(err as Error).message}`,
      );
   }
}

export async function deleteContent(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(content)
         .where(eq(content.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw AppError.database("Content not found");
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete content: ${(err as Error).message}`,
      );
   }
}

export async function deleteBulkContent(
   dbClient: DatabaseInstance,
   ids: string[],
): Promise<{ deletedCount: number }> {
   try {
      if (!ids || ids.length === 0) {
         return { deletedCount: 0 };
      }

      const result = await dbClient
         .delete(content)
         .where(inArray(content.id, ids))
         .returning();

      return { deletedCount: result.length };
   } catch (err) {
      throw AppError.database(
         `Failed to delete bulk content: ${(err as Error).message}`,
      );
   }
}

export async function approveBulkContent(
   dbClient: DatabaseInstance,
   ids: string[],
): Promise<{ approvedCount: number }> {
   try {
      if (!ids || ids.length === 0) {
         return { approvedCount: 0 };
      }

      // First, verify all content items are in draft status
      const contentsToApprove = await dbClient.query.content.findMany({
         where: inArray(content.id, ids),
         columns: { id: true, status: true, meta: true, agentId: true },
      });

      const draftContentIds = contentsToApprove
         .filter((item) => item.status === "draft")
         .map((item) => item.id);

      if (draftContentIds.length === 0) {
         return { approvedCount: 0 };
      }

      // Update status to approved for draft content only
      const result = await dbClient
         .update(content)
         .set({ status: "approved" })
         .where(inArray(content.id, draftContentIds))
         .returning();

      return { approvedCount: result.length };
   } catch (err) {
      throw AppError.database(
         `Failed to approve bulk content: ${(err as Error).message}`,
      );
   }
}

export async function listContents(
   dbClient: DatabaseInstance,
   agentIds: string[],
   status: Array<Exclude<Content["status"], null>>,
) {
   try {
      return await dbClient.query.content.findMany({
         where: (_fields, operators) =>
            operators.and(
               inArray(content.agentId, agentIds),
               inArray(content.status, status),
            ),
         columns: {
            id: true,
            meta: true,
            imageUrl: true,
            status: true,
            createdAt: true,
            stats: true,
            shareStatus: true,
         },
         with: {
            agent: true,
         },
         orderBy: (content, { desc }) => [desc(content.updatedAt)],
      });
   } catch (err) {
      throw AppError.database(
         `Failed to list contents: ${(err as Error).message}`,
      );
   }
}

export async function getContentStatsLast30Days(
   dbClient: DatabaseInstance,
   agentIds: string[],
   status: Array<Exclude<Content["status"], null>> = ["approved", "draft"],
): Promise<{ count: number; wordsCount: number }> {
   try {
      const now = new Date();
      const date30dAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const items = await dbClient.query.content.findMany({
         where: (_fields, operators) =>
            operators.and(
               inArray(content.agentId, agentIds),
               inArray(content.status, status),
               operators.gte(content.createdAt, date30dAgo),
            ),
         columns: {
            stats: true,
         },
      });
      const wordsCount = items.reduce((acc, item) => {
         const wc = item.stats?.wordsCount
            ? parseInt(item.stats.wordsCount, 10)
            : 0;
         return acc + wc;
      }, 0);
      return { count: items.length, wordsCount };
   } catch (err) {
      throw AppError.database(
         `Failed to get content stats: ${(err as Error).message}`,
      );
   }
}

export async function getAgentContentStats(
   dbClient: DatabaseInstance,
   agentId: string,
): Promise<Content[]> {
   try {
      return await dbClient.query.content.findMany({
         where: eq(content.agentId, agentId),
         orderBy: (content, { desc }) => [desc(content.updatedAt)],
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get agent content stats: ${(err as Error).message}`,
      );
   }
}

export async function getMostUsedKeywordsByAgent(
   dbClient: DatabaseInstance,
   agentId: string,
   limit: number = 10,
): Promise<string[]> {
   try {
      // Get all content for the agent
      const items = await dbClient.query.content.findMany({
         where: eq(content.agentId, agentId),
         columns: { meta: true },
      });

      // Aggregate keywords
      const keywordCounts: Record<string, number> = {};
      for (const item of items) {
         const keywords = item.meta?.keywords ?? [];
         for (const kw of keywords) {
            keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
         }
      }

      // Sort and return top N
      return Object.entries(keywordCounts)
         .sort((a, b) => b[1] - a[1])
         .slice(0, limit)
         .map(([kw]) => kw);
   } catch (err) {
      throw AppError.database(
         `Failed to get most used keywords: ${(err as Error).message}`,
      );
   }
}

export async function searchContent(
   dbClient: DatabaseInstance,
   agentIds: string[],
   query: string,
   options: {
      status?: Array<Exclude<Content["status"], null>>;
      layout?: ("tutorial" | "article" | "changelog")[];
      includeBody?: boolean;
      limit?: number;
      offset?: number;
   } = {},
) {
   try {
      const {
         status = ["approved", "draft"],
         layout,
         includeBody = false,
         limit = 20,
         offset = 0,
      } = options;

      if (!query || query.trim().length === 0) {
         return { results: [], totalCount: 0 };
      }

      const searchTerm = `%${query.trim()}%`;

      // Build the search conditions array
      const searchConditionArray = [
         // Search in title
         sql`${content.meta}->>'title' ILIKE ${searchTerm}`,
         // Search in description
         sql`${content.meta}->>'description' ILIKE ${searchTerm}`,
      ];

      // Optionally search in body
      if (includeBody) {
         searchConditionArray.push(sql`${content.body} ILIKE ${searchTerm}`);
      }

      const searchConditions = or(...searchConditionArray);

      // Build the where clause conditions array
      const whereConditionsArray = [
         inArray(content.agentId, agentIds),
         inArray(content.status, status),
         searchConditions,
      ];

      // Add layout filter if specified
      if (layout && layout.length > 0) {
         whereConditionsArray.push(
            sql`${content.request}->>'layout' = ANY(${layout})`,
         );
      }

      // Build the final where clause
      const whereConditions = and(...whereConditionsArray);

      // Get total count
      const countResult = await dbClient
         .select({ count: sql<number>`count(*)::int` })
         .from(content)
         .where(whereConditions);

      const totalCount = countResult[0]?.count ?? 0;

      // Build columns object based on includeBody option
      const columns: Record<string, boolean> = {
         id: true,
         meta: true,
         imageUrl: true,
         status: true,
         createdAt: true,
         updatedAt: true,
         stats: true,
         shareStatus: true,
         request: true,
      };

      if (includeBody) {
         columns.body = true;
      }

      // Get search results with pagination
      const results = await dbClient.query.content.findMany({
         where: whereConditions,
         columns,
         with: {
            agent: true,
         },
         orderBy: (content, { desc }) => [desc(content.updatedAt)],
         limit,
         offset,
      });

      return { results, totalCount };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to search content: ${(err as Error).message}`,
      );
   }
}

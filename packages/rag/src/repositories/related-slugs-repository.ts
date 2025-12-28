import { AppError, propagateError } from "@packages/utils/errors";
import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { createEmbedding } from "../helpers";
import {
   type RelatedSlugs,
   type RelatedSlugsInsert,
   relatedSlugs,
} from "../schemas/related-slugs-schema";

async function createRelatedSlugs(
   dbClient: PgVectorDatabaseInstance,
   data: RelatedSlugsInsert,
) {
   try {
      const result = await dbClient
         .insert(relatedSlugs)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      console.error("Failed to create related slugs:", err);
      throw AppError.database("Failed to create related slugs");
   }
}

export async function createRelatedSlugsWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      RelatedSlugsInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      const { embedding } = await createEmbedding(data.slug);
      return await createRelatedSlugs(dbClient, {
         ...data,
         embedding,
      });
   } catch (err) {
      console.error("Failed to create related slugs with embedding:", err);
      propagateError(err);
   }
}

export async function deleteRelatedSlugsBySlug(
   dbClient: PgVectorDatabaseInstance,
   slug: string,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(relatedSlugs)
         .where(eq(relatedSlugs.slug, slug))
         .returning({ id: relatedSlugs.id });

      return result.length;
   } catch (err) {
      console.error("Failed to delete related slugs by slug:", err);
      throw AppError.database(
         `Failed to delete related slugs by slug: ${(err as Error).message}`,
      );
   }
}

export async function bulkDeleteRelatedSlugsBySlugs(
   dbClient: PgVectorDatabaseInstance,
   slugs: string[],
): Promise<number> {
   try {
      const result = await dbClient
         .delete(relatedSlugs)
         .where(sql`${relatedSlugs.slug} = ANY(${slugs})`)
         .returning({ id: relatedSlugs.id });

      return result.length;
   } catch (err) {
      console.error("Failed to bulk delete related slugs by slugs:", err);
      throw AppError.database(
         `Failed to bulk delete related slugs by slugs: ${(err as Error).message}`,
      );
   }
}

export async function deleteRelatedSlugsByExternalId(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   slug: string,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(relatedSlugs)
         .where(
            and(
               eq(relatedSlugs.externalId, externalId),
               eq(relatedSlugs.slug, slug),
            ),
         )
         .returning({ id: relatedSlugs.id });

      return result.length;
   } catch (err) {
      console.error(
         "Failed to delete related slugs by externalId and slug:",
         err,
      );
      throw AppError.database(
         `Failed to delete related slugs by externalId and slug: ${(err as Error).message}`,
      );
   }
}

interface RelatedSlugsSearchOptions {
   limit?: number;
   similarityThreshold?: number;
}

async function searchRelatedSlugsByCosineSimilarity(
   dbClient: PgVectorDatabaseInstance,
   queryEmbedding: number[],
   externalId: string,
   options: RelatedSlugsSearchOptions = {},
) {
   try {
      const { limit = 10, similarityThreshold = 0.7 } = options;

      const similarity = sql<number>`1 - (${cosineDistance(relatedSlugs.embedding, queryEmbedding)})`;

      const result = await dbClient.query.relatedSlugs.findMany({
         columns: { slug: true },
         limit,
         orderBy: [desc(similarity)],
         where: and(
            gt(similarity, similarityThreshold),
            eq(relatedSlugs.externalId, externalId),
         ),
      });

      return result;
   } catch (err) {
      console.error(
         "Failed to search related slugs by cosine similarity:",
         err,
      );
      throw AppError.database(
         "Failed to search related slugs by cosine similarity",
      );
   }
}

export async function searchRelatedSlugsByText(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   externalId: string,
   options: RelatedSlugsSearchOptions = {},
) {
   try {
      const { embedding } = await createEmbedding(queryText);
      return await searchRelatedSlugsByCosineSimilarity(
         dbClient,
         embedding,
         externalId,
         options,
      );
   } catch (err) {
      console.error("Failed to search related slugs by text:", err);
      throw AppError.database(
         `Failed to search related slugs by text: ${(err as Error).message}`,
      );
   }
}

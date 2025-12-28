import { AppError, propagateError } from "@packages/utils/errors";
import { and, cosineDistance, desc, eq, gt, inArray, sql } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { createEmbedding, createEmbeddings } from "../helpers";
import {
   type CompetitorKnowledgeInsert,
   type CompetitorKnowledgeSelect,
   type CompetitorKnowledgeType,
   competitorKnowledge,
} from "../schemas/competitor-knowledge-schema";

export async function createCompetitorKnowledgeWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      CompetitorKnowledgeInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      const { embedding } = await createEmbedding(data.chunk);
      const result = await dbClient
         .insert(competitorKnowledge)
         .values({
            ...data,
            embedding,
         })
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create competitor knowledge with embedding: ${(err as Error).message}`,
      );
   }
}

export async function deleteCompetitorKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: CompetitorKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(competitorKnowledge)
         .where(
            and(
               eq(competitorKnowledge.externalId, externalId),
               eq(competitorKnowledge.type, type),
            ),
         )
         .returning({ id: competitorKnowledge.id });

      return result.length;
   } catch (err) {
      throw AppError.database(
         `Failed to delete competitor knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

export async function deleteAllCompetitorKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: CompetitorKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(competitorKnowledge)
         .where(
            and(
               eq(competitorKnowledge.externalId, externalId),
               eq(competitorKnowledge.type, type),
            ),
         )
         .returning({ id: competitorKnowledge.id });

      return result.length;
   } catch (err) {
      throw AppError.database(
         `Failed to delete all competitor knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

interface SearchOptions {
   limit?: number;
   similarityThreshold?: number;
   type?: CompetitorKnowledgeType;
}

async function searchCompetitorKnowledgeByCosineSimilarityAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryEmbedding: number[],
   externalId: string | string[],
   options: SearchOptions = {},
) {
   try {
      const { limit = 10, similarityThreshold = 0.5, type } = options;

      const similarity = sql<number>`1 - (${cosineDistance(competitorKnowledge.embedding, queryEmbedding)})`;

      const externalIdCondition = Array.isArray(externalId)
         ? inArray(competitorKnowledge.externalId, externalId)
         : eq(competitorKnowledge.externalId, externalId);

      let whereConditions = and(
         externalIdCondition,
         gt(similarity, similarityThreshold),
      );

      if (type) {
         whereConditions = and(
            externalIdCondition,
            eq(competitorKnowledge.type, type),
            gt(similarity, similarityThreshold),
         );
      }

      const result = await dbClient
         .select({
            chunk: competitorKnowledge.chunk,
            externalId: competitorKnowledge.externalId,
            similarity,
            type: competitorKnowledge.type,
         })
         .from(competitorKnowledge)
         .where(whereConditions)
         .orderBy((t) => desc(t.similarity))
         .limit(limit);

      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to search competitor knowledge by cosine similarity and external ID: ${(err as Error).message}`,
      );
   }
}

export async function searchCompetitorKnowledgeByTextAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   externalId: string | string[],
   options: SearchOptions = {},
) {
   try {
      const { embedding } = await createEmbedding(queryText);
      return await searchCompetitorKnowledgeByCosineSimilarityAndExternalId(
         dbClient,
         embedding,
         externalId,
         options,
      );
   } catch (err) {
      throw AppError.database(
         `Failed to search competitor knowledge by text and external ID: ${(err as Error).message}`,
      );
   }
}

export async function createCompetitorKnowledgeWithEmbeddingsBulk(
   dbClient: PgVectorDatabaseInstance,
   dataArray: Array<
      Omit<
         CompetitorKnowledgeInsert,
         "embedding" | "id" | "createdAt" | "updatedAt"
      >
   >,
): Promise<CompetitorKnowledgeSelect[]> {
   try {
      if (dataArray.length === 0) {
         return [];
      }

      const texts = dataArray.map((data) => data.chunk);
      const embeddings = await createEmbeddings(texts);

      const insertData = dataArray.map((data, index) => {
         const embedding = embeddings[index];
         if (!embedding) {
            throw new Error(
               `Failed to create embedding for chunk: ${data.chunk.substring(0, 100)}...`,
            );
         }
         return {
            ...data,
            embedding,
         };
      });

      const result = await dbClient
         .insert(competitorKnowledge)
         .values(insertData)
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create competitor knowledge with embeddings in bulk: ${(err as Error).message}`,
      );
   }
}

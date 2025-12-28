import { AppError, propagateError } from "@packages/utils/errors";
import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import type { PgVectorDatabaseInstance } from "../client";
import { createEmbedding, createEmbeddings } from "../helpers";
import {
   type BrandKnowledge,
   type BrandKnowledgeInsert,
   type BrandKnowledgeType,
   brandKnowledge,
} from "../schemas/brand-knowledge-schema";

async function createBrandKnowledge(
   dbClient: PgVectorDatabaseInstance,
   data: BrandKnowledgeInsert,
) {
   try {
      const result = await dbClient
         .insert(brandKnowledge)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      throw AppError.database(
         `Failed to create brand knowledge: ${(err as Error).message}`,
      );
   }
}

export async function createBrandKnowledgeWithEmbedding(
   dbClient: PgVectorDatabaseInstance,
   data: Omit<
      BrandKnowledgeInsert,
      "embedding" | "id" | "createdAt" | "updatedAt"
   >,
) {
   try {
      const { embedding } = await createEmbedding(data.chunk);
      return await createBrandKnowledge(dbClient, {
         ...data,
         embedding,
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create brand knowledge with embedding: ${(err as Error).message}`,
      );
   }
}

export async function deleteBrandKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: BrandKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(brandKnowledge)
         .where(
            and(
               eq(brandKnowledge.externalId, externalId),
               eq(brandKnowledge.type, type),
            ),
         )
         .returning({ id: brandKnowledge.id });

      return result.length;
   } catch (err) {
      throw AppError.database(
         `Failed to delete brand knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

export async function deleteAllBrandKnowledgeByExternalIdAndType(
   dbClient: PgVectorDatabaseInstance,
   externalId: string,
   type: BrandKnowledgeType,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(brandKnowledge)
         .where(
            and(
               eq(brandKnowledge.externalId, externalId),
               eq(brandKnowledge.type, type),
            ),
         )
         .returning({ id: brandKnowledge.id });

      return result.length;
   } catch (err) {
      throw AppError.database(
         `Failed to delete all brand knowledge by external ID and type: ${(err as Error).message}`,
      );
   }
}

interface SearchOptions {
   limit?: number;
   similarityThreshold?: number;
   type?: BrandKnowledgeType;
}

async function searchBrandKnowledgeByCosineSimilarityAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryEmbedding: number[],
   externalId: string,
   options: SearchOptions = {},
) {
   try {
      const { limit = 10, similarityThreshold = 0.7, type } = options;

      const similarity = sql<number>`1 - (${cosineDistance(brandKnowledge.embedding, queryEmbedding)})`;

      const baseConditions = [
         eq(brandKnowledge.externalId, externalId),
         gt(similarity, similarityThreshold),
      ];

      const whereConditions = type
         ? and(...baseConditions, eq(brandKnowledge.type, type))
         : and(...baseConditions);

      const result = await dbClient
         .select({
            chunk: brandKnowledge.chunk,
            externalId: brandKnowledge.externalId,
            similarity,
            type: brandKnowledge.type,
         })
         .from(brandKnowledge)
         .where(whereConditions)
         .orderBy((t) => desc(t.similarity))
         .limit(limit);

      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to search brand knowledge by cosine similarity and external ID: ${(err as Error).message}`,
      );
   }
}

export async function searchBrandKnowledgeByTextAndExternalId(
   dbClient: PgVectorDatabaseInstance,
   queryText: string,
   externalId: string,
   options: SearchOptions = {},
) {
   try {
      const { embedding } = await createEmbedding(queryText);
      return await searchBrandKnowledgeByCosineSimilarityAndExternalId(
         dbClient,
         embedding,
         externalId,
         options,
      );
   } catch (err) {
      throw AppError.database(
         `Failed to search brand knowledge by text and external ID: ${(err as Error).message}`,
      );
   }
}

export async function createBrandKnowledgeWithEmbeddingsBulk(
   dbClient: PgVectorDatabaseInstance,
   dataArray: Array<
      Omit<BrandKnowledgeInsert, "embedding" | "id" | "createdAt" | "updatedAt">
   >,
): Promise<BrandKnowledge[]> {
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
         .insert(brandKnowledge)
         .values(insertData)
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create brand knowledge with embeddings in bulk: ${(err as Error).message}`,
      );
   }
}

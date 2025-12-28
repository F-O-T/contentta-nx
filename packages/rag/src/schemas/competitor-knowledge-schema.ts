import {
   index,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
   vector,
} from "drizzle-orm/pg-core";

export const competitorKnowledgeType = pgEnum("competitor_knowledge_type", [
   "feature",
   "document",
]);
export const competitorKnowledge = pgTable(
   "competitor_knowledge",
   {
      chunk: text("chunk").notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      externalId: uuid("external_id").notNull(),
      id: uuid("id").primaryKey().defaultRandom(),
      sourceId: text("source_id").notNull(),
      type: competitorKnowledgeType("knowledge_type").notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("competitorKnowledgeEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);

export type CompetitorKnowledgeSelect = typeof competitorKnowledge.$inferSelect;
export type CompetitorKnowledgeInsert = typeof competitorKnowledge.$inferInsert;
export type CompetitorKnowledgeType =
   (typeof competitorKnowledgeType.enumValues)[number];

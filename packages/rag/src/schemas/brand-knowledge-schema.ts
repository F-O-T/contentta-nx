import {
   index,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
   vector,
} from "drizzle-orm/pg-core";

export const brandKnowledgeType = pgEnum("brand_knowledge_type", [
   "feature",
   "document",
]);
export const brandKnowledge = pgTable(
   "brand_knowledge",
   {
      chunk: text("chunk").notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      externalId: text("external_id").notNull(),
      id: uuid("id").primaryKey().defaultRandom(),
      sourceId: text("source_id").notNull(),
      type: brandKnowledgeType("knowledge_type").notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("brandKnowledgeEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);
export type BrandKnowledge = typeof brandKnowledge.$inferSelect;
export type BrandKnowledgeInsert = typeof brandKnowledge.$inferInsert;
export type BrandKnowledgeType = (typeof brandKnowledgeType.enumValues)[number];

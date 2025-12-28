import {
   index,
   pgTable,
   text,
   timestamp,
   uuid,
   vector,
} from "drizzle-orm/pg-core";

export const relatedSlugs = pgTable(
   "related_slugs",
   {
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      externalId: uuid("external_id").notNull(),
      id: uuid("id").primaryKey().defaultRandom(),
      slug: text("slug").notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("relatedSlugsEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);

export type RelatedSlugs = typeof relatedSlugs.$inferSelect;
export type RelatedSlugsInsert = typeof relatedSlugs.$inferInsert;

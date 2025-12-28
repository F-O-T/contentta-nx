import {
   index,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
   vector,
} from "drizzle-orm/pg-core";

export const ideaLayoutType = pgEnum("idea_layout_type", [
   "tutorial",
   "article",
   "changelog",
]);

export const ideasRag = pgTable(
   "ideas_rag",
   {
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      description: text("description").notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      externalId: uuid("external_id").notNull(),
      id: uuid("id").primaryKey().defaultRandom(),
      layout: ideaLayoutType("layout").notNull(),
      title: text("title").notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("ideasRagEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);

export type IdeasRag = typeof ideasRag.$inferSelect;
export type IdeasRagInsert = typeof ideasRag.$inferInsert;
export type IdeaLayoutType = (typeof ideaLayoutType.enumValues)[number];

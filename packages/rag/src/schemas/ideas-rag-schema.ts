import {
   pgTable,
   index,
   text,
   timestamp,
   uuid,
   vector,
   pgEnum,
} from "drizzle-orm/pg-core";

export const ideaLayoutType = pgEnum("idea_layout_type", [
   "tutorial",
   "article",
   "changelog",
]);

export const ideasRag = pgTable(
   "ideas_rag",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      externalId: uuid("external_id").notNull(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      layout: ideaLayoutType("layout").notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
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

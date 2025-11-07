import { relations } from "drizzle-orm";
import {
   index,
   jsonb,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization } from "./auth";
import { brandFeature } from "./brand-features";

export const brandKnowledgeStatusEnum = pgEnum("brand_knowledge_status", [
   "failed",
   "analyzing",
   "completed",
]);

export const brand = pgTable(
   "brand",
   {
      createdAt: timestamp("created_at").defaultNow().notNull(),
      id: uuid("id").primaryKey().defaultRandom(),
      organizationId: text("organization_id")
         .references(() => organization.id, { onDelete: "cascade" })
         .notNull(),
      status: brandKnowledgeStatusEnum("status").default("analyzing"),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
      uploadedFiles: jsonb("uploaded_files")
         .$type<{ fileName: string; fileUrl: string; uploadedAt: string }[]>()
         .default([]),
      websiteUrl: text("website_url"),
   },
   (table) => [index("brand_organization_id_idx").on(table.organizationId)],
);

export const brandRelations = relations(brand, ({ many }) => ({
   features: many(brandFeature),
}));

export type BrandSelect = typeof brand.$inferSelect;
export type BrandInsert = typeof brand.$inferInsert;
export type BrandKnowledgeStatus =
   (typeof brandKnowledgeStatusEnum.enumValues)[number];

export const BrandInsertSchema = createInsertSchema(brand);
export const BrandSelectSchema = createSelectSchema(brand);

import { relations, sql } from "drizzle-orm";
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
import { z } from "zod";
import { brand } from "./brand";

// Document types from the Mastra workflow
export const brandDocumentTypeEnum = pgEnum("brand_document_type", [
	"brand_identity",
	"product_catalog",
	"market_analysis",
	"customer_personas",
	"content_guidelines",
]);

// Zod schema for document content structure
export const BrandDocumentContentSchema = z.object({
	sections: z
		.array(
			z.object({
				title: z.string(),
				content: z.string(),
				subsections: z
					.array(
						z.object({
							title: z.string(),
							content: z.string(),
						}),
					)
					.optional(),
			}),
		)
		.optional(),
	summary: z.string().optional(),
	keyPoints: z.array(z.string()).optional(),
	rawMarkdown: z.string().optional(),
});

export type BrandDocumentContent = z.infer<typeof BrandDocumentContentSchema>;

export const brandDocument = pgTable(
	"brand_document",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		brandId: uuid("brand_id")
			.notNull()
			.references(() => brand.id, { onDelete: "cascade" }),
		documentType: brandDocumentTypeEnum("document_type").notNull(),
		title: text("title").notNull(),
		content: jsonb("content").$type<BrandDocumentContent>().notNull(),
		sourceUrls: jsonb("source_urls").$type<string[]>().default([]),
		extractedAt: timestamp("extracted_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("brand_document_brand_id_idx").on(table.brandId),
		index("brand_document_type_idx").on(table.brandId, table.documentType),
	],
);

export const brandDocumentRelations = relations(brandDocument, ({ one }) => ({
	brand: one(brand, {
		fields: [brandDocument.brandId],
		references: [brand.id],
	}),
}));

export type BrandDocument = typeof brandDocument.$inferSelect;
export type BrandDocumentInsert = typeof brandDocument.$inferInsert;
export type BrandDocumentType =
	(typeof brandDocumentTypeEnum.enumValues)[number];

export const BrandDocumentInsertSchema = createInsertSchema(brandDocument);
export const BrandDocumentSelectSchema = createSelectSchema(brandDocument);

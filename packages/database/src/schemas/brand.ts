import { relations, sql } from "drizzle-orm";
import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { organization } from "./auth";

// Brand status enum for extraction workflow
export const brandStatusEnum = pgEnum("brand_status", [
	"analyzing",
	"completed",
	"failed",
]);

// Zod schema for uploaded files JSONB
export const UploadedFileSchema = z.object({
	id: z.string(),
	name: z.string(),
	url: z.string(),
	type: z.string(),
	size: z.number(),
	uploadedAt: z.string().datetime(),
});

export type UploadedFile = z.infer<typeof UploadedFileSchema>;

export const brand = pgTable(
	"brand",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		websiteUrl: text("website_url"),
		logoUrl: text("logo_url"),
		summary: text("summary"),
		status: brandStatusEnum("status").default("analyzing").notNull(),
		uploadedFiles: jsonb("uploaded_files").$type<UploadedFile[]>().default([]),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		unique("brand_organization_id_unique").on(table.organizationId),
		index("brand_organization_id_idx").on(table.organizationId),
		index("brand_status_idx").on(table.status),
	],
);

export const brandRelations = relations(brand, ({ one }) => ({
	organization: one(organization, {
		fields: [brand.organizationId],
		references: [organization.id],
	}),
}));

export type Brand = typeof brand.$inferSelect;
export type BrandInsert = typeof brand.$inferInsert;
export type BrandStatus = (typeof brandStatusEnum.enumValues)[number];

export const BrandInsertSchema = createInsertSchema(brand);
export const BrandSelectSchema = createSelectSchema(brand);

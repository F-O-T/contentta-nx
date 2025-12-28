import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { member } from "./auth";
import { content } from "./content";

// Zod schema for line diff entries
export const LineDiffEntrySchema = z.object({
	type: z.enum(["add", "remove", "unchanged", "modify"]),
	content: z.string(),
	lineNumber: z.number().optional(),
	oldLineNumber: z.number().optional(),
	newLineNumber: z.number().optional(),
});

// Zod schema for version meta
export const ContentVersionMetaSchema = z.object({
	changedFields: z.array(z.string()).optional(),
	diff: z.string().optional(), // Unified diff format
	lineDiff: z.array(LineDiffEntrySchema).optional(),
	summary: z.string().optional(), // AI-generated summary of changes
});

export type ContentVersionMeta = z.infer<typeof ContentVersionMetaSchema>;

export const contentVersion = pgTable(
	"content_version",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		contentId: uuid("content_id")
			.notNull()
			.references(() => content.id, { onDelete: "cascade" }),
		memberId: uuid("member_id").references(() => member.id, {
			onDelete: "set null",
		}),
		version: integer("version").notNull(),
		body: text("body").notNull(),
		meta: jsonb("meta").$type<ContentVersionMeta>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("content_version_content_id_idx").on(table.contentId),
		index("content_version_member_id_idx").on(table.memberId),
		index("content_version_version_idx").on(table.contentId, table.version),
	],
);

export const contentVersionRelations = relations(contentVersion, ({ one }) => ({
	content: one(content, {
		fields: [contentVersion.contentId],
		references: [content.id],
	}),
	member: one(member, {
		fields: [contentVersion.memberId],
		references: [member.id],
	}),
}));

export type ContentVersion = typeof contentVersion.$inferSelect;
export type ContentVersionInsert = typeof contentVersion.$inferInsert;

export const ContentVersionInsertSchema = createInsertSchema(contentVersion);
export const ContentVersionSelectSchema = createSelectSchema(contentVersion);

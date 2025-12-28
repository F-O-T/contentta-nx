import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { member } from "./auth";
import { content } from "./content";
import { contentVersion } from "./content-version";

// Export format enum
export const exportFormatEnum = pgEnum("export_format", [
	"md",
	"json",
	"html",
]);

// Export destination enum
export const exportDestinationEnum = pgEnum("export_destination", [
	"download",
	"github",
	"notion",
	"wordpress",
	"custom_api",
]);

// Zod schema for export options
export const ExportOptionsSchema = z.object({
	fileName: z.string().optional(),
	includeMetadata: z.boolean().optional(),
	includeImages: z.boolean().optional(),
	webhookUrl: z.string().url().optional(),
	repositoryPath: z.string().optional(),
	customHeaders: z.record(z.string(), z.string()).optional(),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

export const exportLog = pgTable(
	"export_log",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		contentId: uuid("content_id")
			.notNull()
			.references(() => content.id, { onDelete: "cascade" }),
		contentVersionId: uuid("content_version_id").references(
			() => contentVersion.id,
			{ onDelete: "set null" },
		),
		memberId: uuid("member_id")
			.notNull()
			.references(() => member.id, { onDelete: "cascade" }),
		format: exportFormatEnum("format").notNull(),
		destination: exportDestinationEnum("destination")
			.default("download")
			.notNull(),
		options: jsonb("options").$type<ExportOptions>().default({}).notNull(),
		downloadCount: integer("download_count").default(1).notNull(),
		lastDownloadedAt: timestamp("last_downloaded_at").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("export_log_content_id_idx").on(table.contentId),
		index("export_log_member_id_idx").on(table.memberId),
		index("export_log_format_idx").on(table.format),
		index("export_log_destination_idx").on(table.destination),
	],
);

export const exportLogRelations = relations(exportLog, ({ one }) => ({
	content: one(content, {
		fields: [exportLog.contentId],
		references: [content.id],
	}),
	contentVersion: one(contentVersion, {
		fields: [exportLog.contentVersionId],
		references: [contentVersion.id],
	}),
	member: one(member, {
		fields: [exportLog.memberId],
		references: [member.id],
	}),
}));

export type ExportLog = typeof exportLog.$inferSelect;
export type ExportLogInsert = typeof exportLog.$inferInsert;
export type ExportFormat = (typeof exportFormatEnum.enumValues)[number];
export type ExportDestination =
	(typeof exportDestinationEnum.enumValues)[number];

export const ExportLogInsertSchema = createInsertSchema(exportLog);
export const ExportLogSelectSchema = createSelectSchema(exportLog);

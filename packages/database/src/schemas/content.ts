import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { member } from "./auth";
import { agent } from "./agent";

// Content status enum (traditional CMS flow)
export const contentStatusEnum = pgEnum("content_status", [
	"draft",
	"published",
	"archived",
]);

// Content share status enum
export const contentShareStatusEnum = pgEnum("content_share_status", [
	"private",
	"shared",
]);

// Draft origin enum (how the first draft was created)
export const draftOriginEnum = pgEnum("draft_origin", [
	"manual",
	"ai_generated",
]);

// Content layout enum (for AI full generation)
export const contentLayoutEnum = pgEnum("content_layout", [
	"tutorial",
	"article",
	"changelog",
]);

// Zod schema for content meta
export const ContentMetaSchema = z.object({
	title: z.string(),
	description: z.string(),
	slug: z.string(),
	keywords: z.array(z.string()).optional(),
	sources: z.array(z.string()).optional(),
});

export type ContentMeta = z.infer<typeof ContentMetaSchema>;

// Zod schema for AI generation request (optional)
export const ContentRequestSchema = z.object({
	description: z.string(),
	layout: z.enum(["tutorial", "article", "changelog"]),
});

export type ContentRequest = z.infer<typeof ContentRequestSchema>;

// Zod schema for AI stats (optional - only for AI full generation)
export const ContentStatsSchema = z.object({
	qualityScore: z.string(),
	readTimeMinutes: z.string(),
	wordsCount: z.string(),
	reasonOfTheRating: z.string().optional(),
});

export type ContentStats = z.infer<typeof ContentStatsSchema>;

// Zod schema for AI assistant stats (optional - tracks inline AI help usage)
export const AIAssistantStatsSchema = z.object({
	completions: z.number().default(0),
	edits: z.number().default(0),
	suggestions: z.number().default(0),
	lastUsedAt: z.string().datetime().optional(),
});

export type AIAssistantStats = z.infer<typeof AIAssistantStatsSchema>;

export const content = pgTable(
	"content",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		agentId: uuid("agent_id")
			.notNull()
			.references(() => agent.id, { onDelete: "cascade" }),
		createdByMemberId: uuid("created_by_member_id")
			.notNull()
			.references(() => member.id, { onDelete: "cascade" }),
		body: text("body").default(""),
		imageUrl: text("image_url"),
		currentVersion: integer("current_version").default(1).notNull(),
		status: contentStatusEnum("status").default("draft").notNull(),
		shareStatus: contentShareStatusEnum("share_status")
			.default("private")
			.notNull(),
		draftOrigin: draftOriginEnum("draft_origin").default("manual").notNull(),
		meta: jsonb("meta").$type<ContentMeta>().notNull(),
		request: jsonb("request").$type<ContentRequest>(),
		stats: jsonb("stats").$type<ContentStats>(),
		aiAssistantStats: jsonb("ai_assistant_stats").$type<AIAssistantStats>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("content_agent_id_idx").on(table.agentId),
		index("content_created_by_member_id_idx").on(table.createdByMemberId),
		index("content_status_idx").on(table.status),
		index("content_draft_origin_idx").on(table.draftOrigin),
		index("content_slug_idx").on(table.agentId), // For slug lookups within an agent
	],
);

export const contentRelations = relations(content, ({ one }) => ({
	agent: one(agent, {
		fields: [content.agentId],
		references: [agent.id],
	}),
	createdByMember: one(member, {
		fields: [content.createdByMemberId],
		references: [member.id],
	}),
}));

export type Content = typeof content.$inferSelect;
export type ContentSelect = typeof content.$inferSelect; // Alias for backward compatibility
export type ContentInsert = typeof content.$inferInsert;
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type ContentShareStatus =
	(typeof contentShareStatusEnum.enumValues)[number];
export type DraftOrigin = (typeof draftOriginEnum.enumValues)[number];
export type ContentLayout = (typeof contentLayoutEnum.enumValues)[number];

export const ContentInsertSchema = createInsertSchema(content);
export const ContentSelectSchema = createSelectSchema(content);

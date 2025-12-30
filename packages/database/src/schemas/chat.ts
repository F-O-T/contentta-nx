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
import { content } from "./content";
import { organization } from "./auth";

// Chat message role enum
export const chatMessageRoleEnum = pgEnum("chat_message_role", [
	"user",
	"assistant",
]);

// Selection context schema for JSONB
export const SelectionContextSchema = z.object({
	text: z.string(),
	contextBefore: z.string().default(""),
	contextAfter: z.string().default(""),
});

export type SelectionContext = z.infer<typeof SelectionContextSchema>;

// Stored tool call schema for JSONB
export const StoredToolCallSchema = z.object({
	id: z.string(),
	name: z.string(),
	args: z.record(z.string(), z.unknown()),
	result: z.unknown().optional(),
	status: z.enum(["completed", "error"]),
	executedAt: z.number().optional(),
});

export type StoredToolCall = z.infer<typeof StoredToolCallSchema>;

// Chat session - one per content document
export const chatSession = pgTable(
	"chat_session",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		contentId: uuid("content_id")
			.notNull()
			.references(() => content.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("chat_session_content_id_idx").on(table.contentId),
		index("chat_session_organization_id_idx").on(table.organizationId),
	],
);

export const chatSessionRelations = relations(chatSession, ({ one, many }) => ({
	content: one(content, {
		fields: [chatSession.contentId],
		references: [content.id],
	}),
	organization: one(organization, {
		fields: [chatSession.organizationId],
		references: [organization.id],
	}),
	messages: many(chatMessage),
}));

// Individual chat messages
export const chatMessage = pgTable(
	"chat_message",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => chatSession.id, { onDelete: "cascade" }),
		role: chatMessageRoleEnum("role").notNull(),
		content: text("content").notNull(),
		selectionContext: jsonb("selection_context").$type<SelectionContext>(),
		toolCalls: jsonb("tool_calls").$type<StoredToolCall[]>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("chat_message_session_id_idx").on(table.sessionId),
		index("chat_message_created_at_idx").on(table.createdAt),
	],
);

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
	session: one(chatSession, {
		fields: [chatMessage.sessionId],
		references: [chatSession.id],
	}),
}));

// Types
export type ChatSession = typeof chatSession.$inferSelect;
export type ChatSessionInsert = typeof chatSession.$inferInsert;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type ChatMessageInsert = typeof chatMessage.$inferInsert;
export type ChatMessageRole = (typeof chatMessageRoleEnum.enumValues)[number];

// Zod schemas for validation
export const ChatSessionInsertSchema = createInsertSchema(chatSession);
export const ChatSessionSelectSchema = createSelectSchema(chatSession);
export const ChatMessageInsertSchema = createInsertSchema(chatMessage);
export const ChatMessageSelectSchema = createSelectSchema(chatMessage);

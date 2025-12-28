import { relations, sql } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { organization } from "./auth";

// Zod schema for persona configuration
export const PersonaMetadataSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	avatar: z.string().optional(),
});

export const PersonaInstructionsSchema = z.object({
	writingGuidelines: z.string().optional(),
	audienceProfile: z.string().optional(),
	ragIntegration: z.boolean().default(true),
	tone: z.string().optional(),
	style: z.string().optional(),
});

export const PersonaConfigSchema = z.object({
	metadata: PersonaMetadataSchema,
	instructions: PersonaInstructionsSchema.optional(),
});

export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;

export const agent = pgTable(
	"agent",
	{
		id: uuid("id")
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		personaConfig: jsonb("persona_config").$type<PersonaConfig>().notNull(),
		profilePhotoUrl: text("profile_photo_url"),
		lastGeneratedAt: timestamp("last_generated_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("agent_organization_id_idx").on(table.organizationId),
	],
);

export const agentRelations = relations(agent, ({ one }) => ({
	organization: one(organization, {
		fields: [agent.organizationId],
		references: [organization.id],
	}),
}));

export type Agent = typeof agent.$inferSelect;
export type AgentInsert = typeof agent.$inferInsert;

export const AgentInsertSchema = createInsertSchema(agent);
export const AgentSelectSchema = createSelectSchema(agent);

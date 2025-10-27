import {
   pgTable,
   uuid,
   text,
   timestamp,
   index,
   pgEnum,
   jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization, user } from "./auth";
import { relations } from "drizzle-orm";
import { competitorFeature } from "./competitor-feature";
import type { CompetitorFeatureSelect } from "./competitor-feature";
import z from "zod";

export const knowledgeCreationStatusEnum = pgEnum("knowledge_creation_status", [
   "failed",
   "analyzing",
   "completed",
]);

export const CompetitorFindingsSchema = z
   .object({
      insights: z.array(
         z
            .string()
            .describe(
               "Key insights about the competitor's strategies, features, or market position",
            ),
      ),
      priorities: z.array(
         z
            .string()
            .describe(
               "Actionable priorities based on the competitive analysis, ordered by importance",
            ),
      ),
   })
   .describe(
      "Structured data representing competitive intelligence findings and recommended actions",
   );
export type CompetitorFindings = z.infer<typeof CompetitorFindingsSchema>;
export const competitor = pgTable(
   "competitor",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      websiteUrl: text("website_url").notNull(),
      name: text("name"),
      summary: text("summary"),
      logoPhoto: text("logo_photo"),
      status: knowledgeCreationStatusEnum("status").default("analyzing"),
      userId: text("user_id").references(() => user.id, {
         onDelete: "cascade",
      }),
      organizationId: text("organization_id")
         .references(() => organization.id, { onDelete: "cascade" })
         .notNull(),
      findings: jsonb("findings")
         .$type<CompetitorFindings>()
         .default({ insights: [], priorities: [] }),
      uploadedFiles: jsonb("uploaded_files")
         .$type<{ fileName: string; fileUrl: string; uploadedAt: string }[]>()
         .default([]),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("competitor_organization_id_idx").on(table.organizationId),
      index("competitor_user_id_idx").on(table.userId),
   ],
);

export const competitorRelations = relations(competitor, ({ many }) => ({
   features: many(competitorFeature),
}));

export type CompetitorSelect = typeof competitor.$inferSelect;
export type CompetitorInsert = typeof competitor.$inferInsert;
export type KnowledgeCreationStatus =
   (typeof knowledgeCreationStatusEnum.enumValues)[number];

export type CompetitorWithFeatures = CompetitorSelect & {
   features: CompetitorFeatureSelect[];
};

export const CompetitorInsertSchema = createInsertSchema(competitor);
export const CompetitorSelectSchema = createSelectSchema(competitor);

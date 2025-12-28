import { relations, sql } from "drizzle-orm";
import {
   index,
   pgEnum,
   pgTable,
   timestamp,
   unique,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

// Extensible enum for future resource types
export const resourceTypeEnum = pgEnum("resource_type", ["bank_account"]);

// Permission levels with clear hierarchy: manage > edit > view
export const permissionLevelEnum = pgEnum("permission_level", [
   "view",
   "edit",
   "manage",
]);

// Grantee types - who receives the permission
export const granteeTypeEnum = pgEnum("grantee_type", ["user", "team"]);

// Resource permission table - grants access to specific resources
export const resourcePermission = pgTable(
   "resource_permission",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      resourceType: resourceTypeEnum("resource_type").notNull(),
      resourceId: uuid("resource_id").notNull(),
      granteeType: granteeTypeEnum("grantee_type").notNull(),
      granteeId: uuid("grantee_id").notNull(),
      permission: permissionLevelEnum("permission").notNull(),
      grantedBy: uuid("granted_by")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      // Unique constraint: one permission per resource per grantee
      unique("resource_permission_unique").on(
         table.resourceType,
         table.resourceId,
         table.granteeType,
         table.granteeId,
      ),
      // Index for querying by organization
      index("resource_permission_organization_idx").on(table.organizationId),
      // Index for querying permissions by resource
      index("resource_permission_resource_idx").on(
         table.resourceType,
         table.resourceId,
      ),
      // Index for querying permissions by grantee
      index("resource_permission_grantee_idx").on(
         table.granteeType,
         table.granteeId,
      ),
   ],
);

// Relations
export const resourcePermissionRelations = relations(
   resourcePermission,
   ({ one }) => ({
      organization: one(organization, {
         fields: [resourcePermission.organizationId],
         references: [organization.id],
      }),
      grantedByUser: one(user, {
         fields: [resourcePermission.grantedBy],
         references: [user.id],
      }),
      // Conditional relations for grantee (either user or team)
      granteeUser: one(user, {
         fields: [resourcePermission.granteeId],
         references: [user.id],
      }),
      granteeTeam: one(team, {
         fields: [resourcePermission.granteeId],
         references: [team.id],
      }),
   }),
);

// Type exports
export type ResourcePermission = typeof resourcePermission.$inferSelect;
export type NewResourcePermission = typeof resourcePermission.$inferInsert;
export type ResourceType = (typeof resourceTypeEnum.enumValues)[number];
export type PermissionLevel = (typeof permissionLevelEnum.enumValues)[number];
export type GranteeType = (typeof granteeTypeEnum.enumValues)[number];

// Permission level hierarchy for comparison
export const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
   view: 1,
   edit: 2,
   manage: 3,
};

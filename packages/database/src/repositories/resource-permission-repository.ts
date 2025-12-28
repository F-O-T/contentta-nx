import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq, inArray, or } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type GranteeType,
   type NewResourcePermission,
   PERMISSION_HIERARCHY,
   type PermissionLevel,
   type ResourceType,
   resourcePermission,
} from "../schemas/resource-permissions";

/**
 * Get all team IDs that a user belongs to within an organization
 */
export async function getUserTeamIds(
   dbClient: DatabaseInstance,
   userId: string,
   organizationId: string,
): Promise<string[]> {
   try {
      const teamMemberships = await dbClient.query.teamMember.findMany({
         where: (tm, { eq }) => eq(tm.userId, userId),
         with: {
            team: true,
         },
      });

      // Filter to only teams in this organization
      return teamMemberships
         .filter((tm) => tm.team.organizationId === organizationId)
         .map((tm) => tm.teamId);
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get user team ids: ${(err as Error).message}`,
      );
   }
}

/**
 * Check if a user has at least the required permission level on a resource
 * Considers both direct user grants and team grants
 */
export async function hasPermission(
   dbClient: DatabaseInstance,
   userId: string,
   organizationId: string,
   resourceType: ResourceType,
   resourceId: string,
   requiredLevel: PermissionLevel,
): Promise<boolean> {
   try {
      const effectivePermission = await getEffectivePermission(
         dbClient,
         userId,
         organizationId,
         resourceType,
         resourceId,
      );

      if (!effectivePermission) {
         return false;
      }

      return (
         PERMISSION_HIERARCHY[effectivePermission] >=
         PERMISSION_HIERARCHY[requiredLevel]
      );
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to check permission: ${(err as Error).message}`,
      );
   }
}

/**
 * Get the highest permission level a user has on a resource
 * Considers both direct user grants and team grants
 */
export async function getEffectivePermission(
   dbClient: DatabaseInstance,
   userId: string,
   organizationId: string,
   resourceType: ResourceType,
   resourceId: string,
): Promise<PermissionLevel | null> {
   try {
      // Get user's team IDs
      const teamIds = await getUserTeamIds(dbClient, userId, organizationId);

      // Build conditions for both user and team grants
      const conditions = [
         and(
            eq(resourcePermission.resourceType, resourceType),
            eq(resourcePermission.resourceId, resourceId),
            eq(resourcePermission.granteeType, "user"),
            eq(resourcePermission.granteeId, userId),
         ),
      ];

      // Add team conditions if user belongs to any teams
      if (teamIds.length > 0) {
         conditions.push(
            and(
               eq(resourcePermission.resourceType, resourceType),
               eq(resourcePermission.resourceId, resourceId),
               eq(resourcePermission.granteeType, "team"),
               inArray(resourcePermission.granteeId, teamIds),
            ),
         );
      }

      const permissions = await dbClient
         .select({ permission: resourcePermission.permission })
         .from(resourcePermission)
         .where(or(...conditions));

      if (permissions.length === 0) {
         return null;
      }

      // Return the highest permission level
      let highest: PermissionLevel = "view";
      for (const p of permissions) {
         if (
            PERMISSION_HIERARCHY[p.permission] > PERMISSION_HIERARCHY[highest]
         ) {
            highest = p.permission;
         }
      }

      return highest;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get effective permission: ${(err as Error).message}`,
      );
   }
}

/**
 * Get all resource IDs a user can access with at least the minimum permission level
 */
export async function getAccessibleResourceIds(
   dbClient: DatabaseInstance,
   userId: string,
   organizationId: string,
   resourceType: ResourceType,
   minPermission: PermissionLevel,
): Promise<string[]> {
   try {
      // Get user's team IDs
      const teamIds = await getUserTeamIds(dbClient, userId, organizationId);

      // Build conditions for both user and team grants
      const conditions = [
         and(
            eq(resourcePermission.organizationId, organizationId),
            eq(resourcePermission.resourceType, resourceType),
            eq(resourcePermission.granteeType, "user"),
            eq(resourcePermission.granteeId, userId),
         ),
      ];

      // Add team conditions if user belongs to any teams
      if (teamIds.length > 0) {
         conditions.push(
            and(
               eq(resourcePermission.organizationId, organizationId),
               eq(resourcePermission.resourceType, resourceType),
               eq(resourcePermission.granteeType, "team"),
               inArray(resourcePermission.granteeId, teamIds),
            ),
         );
      }

      const permissions = await dbClient
         .select({
            resourceId: resourcePermission.resourceId,
            permission: resourcePermission.permission,
         })
         .from(resourcePermission)
         .where(or(...conditions));

      // Group by resource and get highest permission
      const resourcePermissions = new Map<string, PermissionLevel>();

      for (const p of permissions) {
         const current = resourcePermissions.get(p.resourceId);
         if (
            !current ||
            PERMISSION_HIERARCHY[p.permission] > PERMISSION_HIERARCHY[current]
         ) {
            resourcePermissions.set(p.resourceId, p.permission);
         }
      }

      // Filter to resources with sufficient permission
      const minLevel = PERMISSION_HIERARCHY[minPermission];
      const accessibleIds: string[] = [];

      for (const [resourceId, permission] of resourcePermissions) {
         if (PERMISSION_HIERARCHY[permission] >= minLevel) {
            accessibleIds.push(resourceId);
         }
      }

      return accessibleIds;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get accessible resource ids: ${(err as Error).message}`,
      );
   }
}

/**
 * Grant permission to a user or team (upsert)
 */
export async function grantPermission(
   dbClient: DatabaseInstance,
   data: Omit<NewResourcePermission, "id" | "createdAt" | "updatedAt">,
): Promise<typeof resourcePermission.$inferSelect> {
   try {
      const result = await dbClient
         .insert(resourcePermission)
         .values(data)
         .onConflictDoUpdate({
            target: [
               resourcePermission.resourceType,
               resourcePermission.resourceId,
               resourcePermission.granteeType,
               resourcePermission.granteeId,
            ],
            set: {
               permission: data.permission,
               grantedBy: data.grantedBy,
               updatedAt: new Date(),
            },
         })
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to grant permission");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to grant permission: ${(err as Error).message}`,
      );
   }
}

/**
 * Revoke permission from a user or team
 */
export async function revokePermission(
   dbClient: DatabaseInstance,
   resourceType: ResourceType,
   resourceId: string,
   granteeType: GranteeType,
   granteeId: string,
): Promise<boolean> {
   try {
      const result = await dbClient
         .delete(resourcePermission)
         .where(
            and(
               eq(resourcePermission.resourceType, resourceType),
               eq(resourcePermission.resourceId, resourceId),
               eq(resourcePermission.granteeType, granteeType),
               eq(resourcePermission.granteeId, granteeId),
            ),
         )
         .returning();

      return result.length > 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to revoke permission: ${(err as Error).message}`,
      );
   }
}

/**
 * Get all permissions for a resource
 */
export async function getResourcePermissions(
   dbClient: DatabaseInstance,
   resourceType: ResourceType,
   resourceId: string,
): Promise<Array<typeof resourcePermission.$inferSelect>> {
   try {
      const result = await dbClient
         .select()
         .from(resourcePermission)
         .where(
            and(
               eq(resourcePermission.resourceType, resourceType),
               eq(resourcePermission.resourceId, resourceId),
            ),
         );

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get resource permissions: ${(err as Error).message}`,
      );
   }
}

/**
 * Get all permissions for a resource with grantee details (user or team)
 */
export async function getResourcePermissionsWithGrantees(
   dbClient: DatabaseInstance,
   resourceType: ResourceType,
   resourceId: string,
): Promise<
   Array<{
      id: string;
      granteeType: GranteeType;
      granteeId: string;
      permission: PermissionLevel;
      granteeName: string | null;
      granteeImage: string | null;
      grantedAt: Date;
   }>
> {
   try {
      const permissions = await dbClient.query.resourcePermission.findMany({
         where: (rp, { eq, and }) =>
            and(
               eq(rp.resourceType, resourceType),
               eq(rp.resourceId, resourceId),
            ),
         with: {
            granteeUser: true,
            granteeTeam: true,
         },
      });

      return permissions.map((p) => ({
         id: p.id,
         granteeType: p.granteeType,
         granteeId: p.granteeId,
         permission: p.permission,
         granteeName:
            p.granteeType === "user"
               ? (p.granteeUser?.name ?? null)
               : (p.granteeTeam?.name ?? null),
         granteeImage:
            p.granteeType === "user" ? (p.granteeUser?.image ?? null) : null,
         grantedAt: p.createdAt,
      }));
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get resource permissions with grantees: ${(err as Error).message}`,
      );
   }
}

/**
 * Delete all permissions for a resource (used when resource is deleted)
 */
export async function deleteResourcePermissions(
   dbClient: DatabaseInstance,
   resourceType: ResourceType,
   resourceId: string,
): Promise<number> {
   try {
      const result = await dbClient
         .delete(resourcePermission)
         .where(
            and(
               eq(resourcePermission.resourceType, resourceType),
               eq(resourcePermission.resourceId, resourceId),
            ),
         )
         .returning();

      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete resource permissions: ${(err as Error).message}`,
      );
   }
}

/**
 * Bulk grant view permission to all organization members for a resource
 * Used when creating new resources to maintain current behavior
 */
export async function grantViewToAllMembers(
   dbClient: DatabaseInstance,
   organizationId: string,
   resourceType: ResourceType,
   resourceId: string,
   grantedBy: string,
): Promise<number> {
   try {
      // Get all members of the organization
      const members = await dbClient.query.member.findMany({
         where: (m, { eq }) => eq(m.organizationId, organizationId),
      });

      if (members.length === 0) {
         return 0;
      }

      // Insert permissions for all members (except owners who bypass checks)
      const permissions = members
         .filter((m) => m.role !== "owner")
         .map((m) => ({
            organizationId,
            resourceType,
            resourceId,
            granteeType: "user" as const,
            granteeId: m.userId,
            permission: "view" as const,
            grantedBy,
         }));

      if (permissions.length === 0) {
         return 0;
      }

      const result = await dbClient
         .insert(resourcePermission)
         .values(permissions)
         .onConflictDoNothing()
         .returning();

      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to grant view to all members: ${(err as Error).message}`,
      );
   }
}

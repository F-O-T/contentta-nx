import type { DatabaseInstance } from "@packages/database/client";
import {
   getAccessibleResourceIds,
   hasPermission,
} from "@packages/database/repositories/resource-permission-repository";
import type {
   PermissionLevel,
   ResourceType,
} from "@packages/database/schemas/resource-permissions";
import { APIError } from "@packages/utils/errors";
import type { MemberRole } from "../trpc";

/**
 * Check if user has permission on a specific resource.
 * Owners bypass all permission checks.
 *
 * @throws APIError.forbidden if permission denied
 */
export async function checkResourcePermission(
   db: DatabaseInstance,
   userId: string,
   organizationId: string,
   memberRole: MemberRole,
   resourceType: ResourceType,
   resourceId: string,
   requiredPermission: PermissionLevel,
): Promise<void> {
   // Owners bypass all permission checks
   if (memberRole === "owner") {
      return;
   }

   const hasAccess = await hasPermission(
      db,
      userId,
      organizationId,
      resourceType,
      resourceId,
      requiredPermission,
   );

   if (!hasAccess) {
      throw APIError.forbidden(
         "You do not have permission to access this resource.",
      );
   }
}

/**
 * Get accessible resource IDs for the user.
 * Owners get null (meaning they can access all resources).
 *
 * @returns Object with isOwner flag and resourceIds (null for owners)
 */
export async function getAccessibleResources(
   db: DatabaseInstance,
   userId: string,
   organizationId: string,
   memberRole: MemberRole,
   resourceType: ResourceType,
   minPermission: PermissionLevel,
): Promise<{
   isOwner: boolean;
   resourceIds: string[] | null;
}> {
   // Owners can access everything
   if (memberRole === "owner") {
      return {
         isOwner: true,
         resourceIds: null,
      };
   }

   const resourceIds = await getAccessibleResourceIds(
      db,
      userId,
      organizationId,
      resourceType,
      minPermission,
   );

   return {
      isOwner: false,
      resourceIds,
   };
}

/**
 * Check if the user can manage permissions (owners only).
 *
 * @throws APIError.forbidden if not an owner
 */
export function checkCanManagePermissions(memberRole: MemberRole): void {
   if (memberRole !== "owner") {
      throw APIError.forbidden(
         "Only organization owners can manage permissions.",
      );
   }
}

/**
 * Check if user is an organization owner.
 */
export function isOwner(memberRole: MemberRole): boolean {
   return memberRole === "owner";
}

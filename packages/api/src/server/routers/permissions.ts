import {
   getResourcePermissionsWithGrantees,
   grantPermission,
   revokePermission,
} from "@packages/database/repositories/resource-permission-repository";
import {
   granteeTypeEnum,
   permissionLevelEnum,
   resourceTypeEnum,
} from "@packages/database/schemas/resource-permissions";
import { z } from "zod";
import { checkCanManagePermissions } from "../lib/permission-check";
import { type MemberRole, protectedProcedure, router } from "../trpc";

// Helper to extract permission-related context from protectedProcedure
type ProtectedContext = {
   memberRole?: MemberRole;
};

const resourceTypeSchema = z.enum(resourceTypeEnum.enumValues);
const permissionLevelSchema = z.enum(permissionLevelEnum.enumValues);
const granteeTypeSchema = z.enum(granteeTypeEnum.enumValues);

const grantPermissionSchema = z.object({
   resourceType: resourceTypeSchema,
   resourceId: z.string().uuid(),
   granteeType: granteeTypeSchema,
   granteeId: z.string().uuid(),
   permission: permissionLevelSchema,
});

const revokePermissionSchema = z.object({
   resourceType: resourceTypeSchema,
   resourceId: z.string().uuid(),
   granteeType: granteeTypeSchema,
   granteeId: z.string().uuid(),
});

const getForResourceSchema = z.object({
   resourceType: resourceTypeSchema,
   resourceId: z.string().uuid(),
});

export const permissionsRouter = router({
   /**
    * Grant permission to a user or team (owners only)
    */
   grant: protectedProcedure
      .input(grantPermissionSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const memberRole = ((resolvedCtx as ProtectedContext).memberRole ??
            "member") as MemberRole;

         // Only owners can manage permissions
         checkCanManagePermissions(memberRole);

         const result = await grantPermission(resolvedCtx.db, {
            organizationId: resolvedCtx.organizationId,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            granteeType: input.granteeType,
            granteeId: input.granteeId,
            permission: input.permission,
            grantedBy: resolvedCtx.userId,
         });

         return result;
      }),

   /**
    * Revoke permission from a user or team (owners only)
    */
   revoke: protectedProcedure
      .input(revokePermissionSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const memberRole = ((resolvedCtx as ProtectedContext).memberRole ??
            "member") as MemberRole;

         // Only owners can manage permissions
         checkCanManagePermissions(memberRole);

         const success = await revokePermission(
            resolvedCtx.db,
            input.resourceType,
            input.resourceId,
            input.granteeType,
            input.granteeId,
         );

         return { success };
      }),

   /**
    * Get all permissions for a resource (owners only)
    */
   getForResource: protectedProcedure
      .input(getForResourceSchema)
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const memberRole = ((resolvedCtx as ProtectedContext).memberRole ??
            "member") as MemberRole;

         // Only owners can view permissions
         checkCanManagePermissions(memberRole);

         const permissions = await getResourcePermissionsWithGrantees(
            resolvedCtx.db,
            input.resourceType,
            input.resourceId,
         );

         return { permissions };
      }),
});

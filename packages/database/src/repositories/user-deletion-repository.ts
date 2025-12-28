import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   agent,
   brand,
   member,
   notification,
   notificationPreference,
   organization,
   pushSubscription,
} from "../schema";

/**
 * Delete organization-scoped data for a specific organization.
 * This is a helper function used during user deletion.
 */
async function deleteOrganizationScopedData(
   tx: Parameters<Parameters<DatabaseInstance["transaction"]>[0]>[0],
   organizationId: string,
) {
   // Content is deleted via cascade when agent is deleted
   await Promise.all([
      tx.delete(agent).where(eq(agent.organizationId, organizationId)),
      tx.delete(brand).where(eq(brand.organizationId, organizationId)),
   ]);
}

/**
 * Delete all user data from the database across all organizations they belong to.
 * This includes: content, agents, brands, notifications, and memberships.
 *
 * User-specific auth data (sessions, accounts, etc) will cascade via onDelete: "cascade".
 */
export async function deleteAllUserData(db: DatabaseInstance, userId: string) {
   await db.transaction(async (tx) => {
      // First, get all organizations the user belongs to
      const userMemberships = await tx.query.member.findMany({
         where: (m, { eq: mEq }) => mEq(m.userId, userId),
      });

      const organizationIds = userMemberships.map((m) => m.organizationId);

      // Delete organization-scoped data for each organization
      for (const orgId of organizationIds) {
         await deleteOrganizationScopedData(tx, orgId);
      }

      // Delete user-scoped data (once for the user)
      await Promise.all([
         tx
            .delete(notificationPreference)
            .where(eq(notificationPreference.userId, userId)),
         tx.delete(notification).where(eq(notification.userId, userId)),
         tx.delete(pushSubscription).where(eq(pushSubscription.userId, userId)),
      ]);

      // Delete all memberships for this user
      await tx.delete(member).where(eq(member.userId, userId));

      // Check each organization and delete if no remaining members
      for (const orgId of organizationIds) {
         const remainingMembers = await tx.query.member.findMany({
            where: (m, { eq: mEq }) => mEq(m.organizationId, orgId),
         });

         if (remainingMembers.length === 0) {
            await tx.delete(organization).where(eq(organization.id, orgId));
         }
      }
   });
}

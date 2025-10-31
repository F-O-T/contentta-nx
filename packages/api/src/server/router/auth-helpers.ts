import {
   getTotalAgents,
   listAgents,
} from "@packages/database/repositories/agent-repository";
import { isOrganizationOwner } from "@packages/database/repositories/auth-repository";
import { getContentStatsLast30Days } from "@packages/database/repositories/content-repository";
import { getCustomerState } from "@packages/payment/ingestion";
import { APIError, propagateError } from "@packages/utils/errors";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const authHelpersRouter = router({
   getActiveSubscription: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const customer = await resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });
      const activeSubscription = customer.activeSubscriptions[0] || null;
      return activeSubscription;
   }),
   getApiKeys: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const apiKeys = await resolvedCtx.auth.api.listApiKeys({
         headers: resolvedCtx.headers,
      });
      return apiKeys;
   }),
   getBillingInfo: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;

      if (!userId) {
         throw APIError.unauthorized("User not authenticated");
      }

      // Get customer state
      const customerState = await resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });

      // Get active subscription
      const activeSubscription = customerState.activeSubscriptions[0] || null;

      // Determine billing state
      if (!organizationId) {
         // User is not in an organization
         return {
            activeSubscription,
            billingState: activeSubscription
               ? "active_subscription"
               : "no_subscription",
            customerState,
            isOrganizationOwner: true,
            organization: null,
         };
      }

      // User is in an organization
      const isOwner = await isOrganizationOwner(
         resolvedCtx.db,
         userId,
         organizationId,
      );

      // Get organization details
      const organization = await resolvedCtx.db.query.organization.findFirst({
         columns: {
            id: true,
            name: true,
         },
         where: (org, { eq }) => eq(org.id, organizationId),
      });

      if (isOwner) {
         // User is organization owner
         return {
            activeSubscription,
            billingState: activeSubscription
               ? "active_subscription"
               : "no_subscription",
            customerState,
            isOrganizationOwner: true,
            organization,
         };
      } else {
         // User is organization member, billing is managed by organization
         return {
            activeSubscription: null, // Organization members don't have direct subscriptions
            billingState: "organization_member",
            customerState,
            isOrganizationOwner: false,
            organization,
         };
      }
   }),
   getCustomerState: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const customer = resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });
      return customer;
   }),
   getDefaultOrganization: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });
      return organization;
   }),
   getHomeStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const db = resolvedCtx.db;
      const userId = resolvedCtx.session?.user.id;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;
      // Get agents for user/org
      const totalAgents = await getTotalAgents(db, {
         organizationId: organizationId ?? "",
         userId,
      });
      const agents = await listAgents(db, {
         organizationId: organizationId ?? "",
         userId,
      });
      const agentIds = agents.map((a) => a.id);
      // Get content stats for last 30 days
      const contentStats = await getContentStatsLast30Days(db, agentIds, [
         "approved",
         "draft",
      ]);
      return {
         contentGenerated: contentStats.count,
         totalAgents,
         wordCount30d: contentStats.wordsCount,
      };
   }),
   getSession: publicProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      return resolvedCtx.session;
   }),
   isOrganizationOwner: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;

      if (!userId || !organizationId) {
         return true; // If no organization, user manages their own billing
      }

      return await isOrganizationOwner(resolvedCtx.db, userId, organizationId);
   }),
   subscriptionReminder: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;

      if (!userId) {
         throw APIError.unauthorized("User not authenticated");
      }

      if (!organizationId) {
         const { activeSubscriptions } = await resolvedCtx.auth.api.state({
            headers: resolvedCtx.headers,
         });

         return !activeSubscriptions[0];
      }

      // User is in an organization, check if org owner has active subscription
      try {
         // Get all organization members to find the owner
         const organizationMembers = await resolvedCtx.db.query.member.findMany(
            {
               where: (member, { eq }) =>
                  eq(member.organizationId, organizationId),
            },
         );

         const orgOwner = organizationMembers.find(
            (member) => member.role === "owner",
         );

         if (!orgOwner) {
            throw APIError.validation("Organization has no owner");
         }

         // Check org owner's subscription
         const ownerState = await getCustomerState(
            resolvedCtx.polarClient,
            orgOwner.userId,
         );

         return !ownerState?.activeSubscriptions?.[0];
      } catch (error) {
         console.error("Error checking organization owner subscription", error);
         propagateError(error);
         throw APIError.internal("Error checking subscription");
      }
   }),
});

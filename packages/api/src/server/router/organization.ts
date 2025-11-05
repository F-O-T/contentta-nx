import { getTotalAgents } from "@packages/database/repositories/agent-repository";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const organizationRouter = router({
   createOrganization: protectedProcedure
      .input(
         z.object({
            name: z.string().min(1, "Organization name is required"),
            slug: z.string().min(1, "Organization slug is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const organization = await resolvedCtx.auth.api.createOrganization({
               body: {
                  name: input.name,
                  slug: input.slug,
               },
               headers: resolvedCtx.headers,
            });

            return organization;
         } catch (error) {
            console.error("Failed to create organization:", error);
            propagateError(error);
            throw APIError.internal("Failed to create organization");
         }
      }),
   getActiveOrganization: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });
      return organization;
   }),

   // Get organizations with full details using Promise.all (excluding active organization)
   getOrganizations: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      try {
         // First, list all organizations for the user
         const organizations = await resolvedCtx.auth.api.listOrganizations({
            headers: resolvedCtx.headers,
         });

         if (!organizations || organizations.length === 0) {
            return [];
         }

         // Get the active organization ID
         const activeOrganizationId = resolvedCtx.session?.session?.activeOrganizationId;

         // Filter out the active organization from the list
         const otherOrganizations = organizations.filter(
            (org) => org.id !== activeOrganizationId
         );

         return otherOrganizations;
      } catch (error) {
         console.error("Failed to get organizations:", error);
         propagateError(error);
         throw APIError.internal(
            "Failed to retrieve organizations",
         );
      }
   }),

   // Get organization overview stats (existing method)
   getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;
      const db = resolvedCtx.db;
      if (!organizationId) {
         throw new Error("No active organization found");
      }

      try {
         // Get total agents for organization
         const totalAgents = await getTotalAgents(db, {
            organizationId,
         });

         const org = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         return {
            totalAgents,
            totalMembers: org?.members?.length ?? 0,
         };
      } catch (error) {
         console.error("Failed to get organization overview stats:", error);
         throw new Error("Failed to retrieve organization statistics");
      }
   }),

   // Set active organization
   setActiveOrganization: protectedProcedure
      .input(
         z.object({
            organizationId: z.string().optional(), // Empty string for personal account
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            await resolvedCtx.auth.api.setActiveOrganization({
               body: {
                  organizationId: input.organizationId,
               },
               headers: resolvedCtx.headers,
            });

            return { success: true };
         } catch (error) {
            console.error("Failed to set active organization:", error);
            propagateError(error);
            throw APIError.internal("Failed to set active organization");
         }
      }),
});

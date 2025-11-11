import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { organizationProcedure, protectedProcedure, router } from "../trpc";

export const organizationInvitesRouter = router({
   acceptInvitation: protectedProcedure
      .input(
         z.object({
            invitationId: z.string().min(1, "Invitation ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.acceptInvitation({
               body: {
                  invitationId: input.invitationId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to accept invitation:", error);
            propagateError(error);
            throw APIError.internal("Failed to accept invitation");
         }
      }),
   createInvitation: protectedProcedure
      .input(
         z.object({
            email: z.email("Valid email is required"),
            organizationId: z.string().optional(),
            resend: z.boolean().optional(),
            role: z.enum(["member", "admin", "owner"]),
            teamId: z.string().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const invitation = await resolvedCtx.auth.api.createInvitation({
               body: {
                  email: input.email,
                  organizationId: input.organizationId,
                  resend: input.resend,
                  role: input.role,
                  teamId: input.teamId,
               },
               headers: resolvedCtx.headers,
            });

            return invitation;
         } catch (error) {
            console.error("Failed to create invitation:", error);
            propagateError(error);
            throw APIError.internal("Failed to create invitation");
         }
      }),

   declineInvitation: protectedProcedure
      .input(
         z.object({
            invitationId: z.string().min(1, "Invitation ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.rejectInvitation({
               body: {
                  invitationId: input.invitationId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to decline invitation:", error);
            propagateError(error);
            throw APIError.internal("Failed to decline invitation");
         }
      }),

   getInvitation: protectedProcedure
      .input(
         z.object({
            invitationId: z.string().min(1, "Invitation ID is required"),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const invitation = await resolvedCtx.auth.api.getInvitation({
               headers: resolvedCtx.headers,
               query: {
                  id: input.invitationId,
               },
            });

            return invitation;
         } catch (error) {
            console.error("Failed to get invitation:", error);
            propagateError(error);
            throw APIError.internal("Failed to get invitation");
         }
      }),

   getInvitationStats: organizationProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const organizationId = resolvedCtx.session?.session.activeOrganizationId;
      if (!organizationId) {
         throw APIError.validation("Organization not found");
      }

      try {
         // Get all invitations to calculate stats
         const allInvitations = await resolvedCtx.auth.api.listInvitations({
            headers: resolvedCtx.headers,
            query: {
               organizationId,
            },
         });

         const stats = {
            accepted:
               allInvitations?.filter((inv) => inv.status === "accepted")
                  .length || 0,
            pending:
               allInvitations?.filter((inv) => inv.status === "pending")
                  .length || 0,
            rejected:
               allInvitations?.filter((inv) => inv.status === "rejected")
                  .length || 0,
            total: allInvitations?.length || 0,
         };

         return stats;
      } catch (error) {
         console.error("Failed to get invitation stats:", error);
         propagateError(error);
         throw APIError.internal("Failed to get invitation stats");
      }
   }),

   listInvitations: organizationProcedure
      .input(
         z.object({
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         const organizationId =
            resolvedCtx.session?.session.activeOrganizationId;
         if (!organizationId) {
            throw APIError.validation("Organization not found");
         }

         try {
            // Get all invitations from the auth API
            const allInvitations = await resolvedCtx.auth.api.listInvitations({
               headers: resolvedCtx.headers,
               query: {
                  organizationId,
               },
            });
            if (!allInvitations) {
               throw APIError.validation("no invites found");
            }

            // Sort invitations by expiration date (newest first) for consistent pagination
            const sortedInvitations = allInvitations.sort((a, b) => {
               const dateA = new Date(a.expiresAt || 0).getTime();
               const dateB = new Date(b.expiresAt || 0).getTime();
               return dateB - dateA;
            });

            // Apply pagination logic
            const startIndex = input.offset;
            const endIndex = startIndex + input.limit;
            const paginatedInvitations = sortedInvitations.slice(
               startIndex,
               endIndex,
            );
            const total = allInvitations.length;
            const hasMore = endIndex < total;

            return {
               hasMore,
               invitations: paginatedInvitations,
               limit: input.limit,
               offset: input.offset,
               total,
            };
         } catch (error) {
            console.error("Failed to list invitations:", error);
            propagateError(error);
            throw APIError.internal("Failed to list invitations");
         }
      }),
   revokeInvitation: protectedProcedure
      .input(
         z.object({
            invitationId: z.string().min(1, "Invitation ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.cancelInvitation({
               body: {
                  invitationId: input.invitationId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to revoke invitation:", error);
            propagateError(error);
            throw APIError.internal("Failed to revoke invitation");
         }
      }),
});

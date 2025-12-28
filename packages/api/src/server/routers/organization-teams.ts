import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const organizationTeamsRouter = router({
   // Queries only - mutations moved to Better Auth client

   getTeamStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.session?.session.activeOrganizationId;

      if (!organizationId) {
         throw APIError.validation("Organization not found");
      }

      try {
         // Get all teams for the organization using the same pattern as listTeams
         const allTeams = await resolvedCtx.auth.api.listOrganizationTeams({
            headers: resolvedCtx.headers,
            query: {
               organizationId,
            },
         });
         if (!allTeams) {
            throw APIError.notFound("No teams found for the organization");
         }

         const organization = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         const totalMembers = organization?.members?.length || 0;

         const teamsWithMembers = await Promise.all(
            allTeams.map(async (team) => {
               try {
                  const members = await resolvedCtx.auth.api.listTeamMembers({
                     headers: resolvedCtx.headers,
                     query: {
                        teamId: team.id,
                     },
                  });
                  return {
                     ...team,
                     memberCount: members?.length || 0,
                  };
               } catch (error) {
                  console.error(
                     `Failed to get members for team ${team.id}:`,
                     error,
                  );
                  return {
                     ...team,
                     memberCount: 0,
                  };
               }
            }),
         );

         const activeTeams = teamsWithMembers.filter(
            (team) => team.memberCount > 0,
         ).length;
         const configuredTeams = teamsWithMembers.filter(
            (team) => team.name,
         ).length;

         const stats = {
            active: activeTeams,
            configured: configuredTeams,
            total: allTeams?.length || 0,
            totalMembers,
         };

         return stats;
      } catch (error) {
         console.error("Failed to get team stats:", error);
         propagateError(error);
         throw APIError.internal("Failed to get team stats");
      }
   }),

   listTeamMembers: protectedProcedure
      .input(
         z.object({
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
            teamId: z.string().min(1, "Team ID is required"),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const members = await resolvedCtx.auth.api.listTeamMembers({
               headers: resolvedCtx.headers,
               query: {
                  teamId: input.teamId,
               },
            });

            return members;
         } catch (error) {
            console.error("Failed to list team members:", error);
            propagateError(error);
            throw APIError.internal("Failed to list team members");
         }
      }),

   listTeams: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;
      if (!organizationId) {
         throw APIError.notFound("No active organization found");
      }
      try {
         const teams = await resolvedCtx.auth.api.listOrganizationTeams({
            headers: resolvedCtx.headers,
            query: {
               organizationId,
            },
         });

         return teams;
      } catch (error) {
         console.error("Failed to list teams:", error);
         propagateError(error);
         throw APIError.internal("Failed to retrieve teams");
      }
   }),

   getTeamById: protectedProcedure
      .input(z.object({ teamId: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;

         if (!organizationId) {
            throw APIError.notFound("No active organization found");
         }

         try {
            const [teams, members] = await Promise.all([
               resolvedCtx.auth.api.listOrganizationTeams({
                  headers: resolvedCtx.headers,
                  query: { organizationId },
               }),
               resolvedCtx.auth.api.listTeamMembers({
                  headers: resolvedCtx.headers,
                  query: { teamId: input.teamId },
               }),
            ]);

            const team = teams?.find((t) => t.id === input.teamId);

            if (!team) {
               throw APIError.notFound("Team not found");
            }

            return { ...team, members: members ?? [] };
         } catch (error) {
            console.error("Failed to get team by ID:", error);
            propagateError(error);
            throw APIError.internal("Failed to retrieve team");
         }
      }),
});

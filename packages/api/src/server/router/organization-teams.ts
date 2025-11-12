import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { organizationProcedure, protectedProcedure, router } from "../trpc";

export const organizationTeamsRouter = router({
   addMemberToTeam: organizationProcedure
      .input(
         z.object({
            teamId: z.string().min(1, "Team ID is required"),
            userId: z.string().min(1, "User ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.addTeamMember({
               body: {
                  teamId: input.teamId,
                  userId: input.userId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to add member to team:", error);
            propagateError(error);
            throw APIError.internal("Failed to add member to team");
         }
      }),
   createTeam: organizationProcedure
      .input(
         z.object({
            description: z
               .string()
               .max(200, "Description must be less than 200 characters")
               .optional(),
            name: z
               .string()
               .min(1, "Team name is required")
               .max(50, "Team name must be less than 50 characters"),
            organizationId: z.string().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId =
            input.organizationId ||
            resolvedCtx.session?.session.activeOrganizationId;

         if (!organizationId) {
            throw APIError.validation("Organization not found");
         }

         try {
            const team = await resolvedCtx.auth.api.createTeam({
               body: {
                  description: input.description,
                  name: input.name,
                  organizationId,
               },
               headers: resolvedCtx.headers,
            });

            return team;
         } catch (error) {
            console.error("Failed to create team:", error);
            propagateError(error);
            throw APIError.internal("Failed to create team");
         }
      }),

   deleteTeam: organizationProcedure
      .input(
         z.object({
            teamId: z.string().min(1, "Team ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.removeTeam({
               body: {
                  teamId: input.teamId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to delete team:", error);
            propagateError(error);
            throw APIError.internal("Failed to delete team");
         }
      }),

   getTeamStats: organizationProcedure.query(async ({ ctx }) => {
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

   listTeamMembers: organizationProcedure
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
         throw new Error("No active organization found");
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

   removeMemberFromTeam: organizationProcedure
      .input(
         z.object({
            teamId: z.string().min(1, "Team ID is required"),
            userId: z.string().min(1, "User ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.removeTeamMember({
               body: {
                  teamId: input.teamId,
                  userId: input.userId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to remove member from team:", error);
            propagateError(error);
            throw APIError.internal("Failed to remove member from team");
         }
      }),

   updateTeam: organizationProcedure
      .input(
         z.object({
            description: z
               .string()
               .max(200, "Description must be less than 200 characters")
               .optional(),
            name: z
               .string()
               .min(1, "Team name is required")
               .max(50, "Team name must be less than 50 characters")
               .optional(),
            teamId: z.string().min(1, "Team ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const updatedTeam = await resolvedCtx.auth.api.updateTeam({
               body: {
                  teamId: input.teamId,
                  data: {
                     ...(input.name && { name: input.name }),
                     ...(input.description !== undefined && {
                        description: input.description,
                     }),
                  },
               },
               headers: resolvedCtx.headers,
            });

            return updatedTeam;
         } catch (error) {
            console.error("Failed to update team:", error);
            propagateError(error);
            throw APIError.internal("Failed to update team");
         }
      }),
});

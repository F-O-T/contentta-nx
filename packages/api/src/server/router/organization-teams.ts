import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { organizationProcedure, protectedProcedure, router } from "../trpc";

export const organizationTeamsRouter = router({
   addTeamMember: organizationProcedure
      .input(
         z.object({
            role: z.enum(["member", "admin"]).default("member"),
            teamId: z.string().min(1, "Team ID is required"),
            userId: z.string().min(1, "User ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.addTeamMember({
               body: {
                  role: input.role,
                  teamId: input.teamId,
                  userId: input.userId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to add team member:", error);
            propagateError(error);
            throw APIError.internal("Failed to add team member");
         }
      }),
   createTeam: organizationProcedure
      .input(
         z.object({
            description: z.string().optional(),
            name: z.string().min(1, "Team name is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         const organizationId =
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
            await resolvedCtx.auth.api.deleteTeam({
               body: {
                  teamId: input.teamId,
               },
               headers: resolvedCtx.headers,
            });

            return { success: true };
         } catch (error) {
            console.error("Failed to delete team:", error);
            propagateError(error);
            throw APIError.internal("Failed to delete team");
         }
      }),

   getTeam: protectedProcedure
      .input(
         z.object({
            teamId: z.string().min(1, "Team ID is required"),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const team = await resolvedCtx.auth.api.getTeam({
               headers: resolvedCtx.headers,
               query: {
                  id: input.teamId,
               },
            });

            return team;
         } catch (error) {
            console.error("Failed to get team:", error);
            propagateError(error);
            throw APIError.internal("Failed to get team");
         }
      }),

   getTeamStats: organizationProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const organizationId = resolvedCtx.session?.session.activeOrganizationId;
      if (!organizationId) {
         throw APIError.validation("Organization not found");
      }

      try {
         // Get all teams to calculate stats
         const allTeams = await resolvedCtx.auth.api.listOrganizationTeams({
            headers: resolvedCtx.headers,
            query: {
               organizationId,
            },
         });

         const totalMembers =
            allTeams?.reduce(
               (sum, team) => sum + (team.members?.length || 0),
               0,
            ) || 0;

         const stats = {
            averageMembersPerTeam: allTeams?.length
               ? Math.round(totalMembers / allTeams.length)
               : 0,
            totalMembers,
            totalTeams: allTeams?.length || 0,
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
            const team = await resolvedCtx.auth.api.getTeam({
               headers: resolvedCtx.headers,
               query: {
                  id: input.teamId,
               },
            });

            if (!team?.members) {
               return {
                  hasMore: false,
                  limit: input.limit,
                  members: [],
                  offset: input.offset,
                  total: 0,
               };
            }

            // Sort members by join date (newest first) for consistent pagination
            const sortedMembers = team.members.sort((a, b) => {
               const dateA = new Date(a.joinedAt || 0).getTime();
               const dateB = new Date(b.joinedAt || 0).getTime();
               return dateB - dateA;
            });

            // Apply pagination logic
            const startIndex = input.offset;
            const endIndex = startIndex + input.limit;
            const paginatedMembers = sortedMembers.slice(startIndex, endIndex);
            const total = team.members.length;
            const hasMore = endIndex < total;

            return {
               hasMore,
               limit: input.limit,
               members: paginatedMembers,
               offset: input.offset,
               total,
            };
         } catch (error) {
            console.error("Failed to list team members:", error);
            propagateError(error);
            throw APIError.internal("Failed to list team members");
         }
      }),

   listTeams: organizationProcedure
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
            // Get all teams from the auth API
            const allTeams = await resolvedCtx.auth.api.listOrganizationTeams({
               headers: resolvedCtx.headers,
               query: {
                  organizationId,
               },
            });

            if (!allTeams) {
               throw APIError.validation("no teams found");
            }

            // Sort teams by creation date (newest first) for consistent pagination
            const sortedTeams = allTeams.sort((a, b) => {
               const dateA = new Date(a.createdAt || 0).getTime();
               const dateB = new Date(b.createdAt || 0).getTime();
               return dateB - dateA;
            });

            // Apply pagination logic
            const startIndex = input.offset;
            const endIndex = startIndex + input.limit;
            const paginatedTeams = sortedTeams.slice(startIndex, endIndex);
            const total = allTeams.length;
            const hasMore = endIndex < total;

            return {
               hasMore,
               limit: input.limit,
               offset: input.offset,
               teams: paginatedTeams,
               total,
            };
         } catch (error) {
            console.error("Failed to list teams:", error);
            propagateError(error);
            throw APIError.internal("Failed to list teams");
         }
      }),

   removeTeamMember: organizationProcedure
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
            console.error("Failed to remove team member:", error);
            propagateError(error);
            throw APIError.internal("Failed to remove team member");
         }
      }),

   updateTeam: organizationProcedure
      .input(
         z.object({
            description: z.string().optional(),
            name: z.string().min(1, "Team name is required"),
            teamId: z.string().min(1, "Team ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const updatedTeam = await resolvedCtx.auth.api.updateTeam({
               body: {
                  data: {
                     description: input.description,
                     name: input.name,
                  },
                  teamId: input.teamId,
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

   updateTeamMemberRole: organizationProcedure
      .input(
         z.object({
            role: z.enum(["member", "admin"]),
            teamId: z.string().min(1, "Team ID is required"),
            userId: z.string().min(1, "User ID is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const result = await resolvedCtx.auth.api.updateTeamMemberRole({
               body: {
                  role: input.role,
                  teamId: input.teamId,
                  userId: input.userId,
               },
               headers: resolvedCtx.headers,
            });

            return result;
         } catch (error) {
            console.error("Failed to update team member role:", error);
            propagateError(error);
            throw APIError.internal("Failed to update team member role");
         }
      }),
});

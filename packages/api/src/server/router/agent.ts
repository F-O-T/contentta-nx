import {
   createAgent,
   getAgentById,
   updateAgent,
   deleteAgent,
   listAgents,
   getTotalAgents,
} from "@packages/database/repositories/agent-repository";
import { APIError, propagateError } from "@packages/utils/errors";
import {
   protectedProcedure,
   organizationOwnerProcedure,
   router,
} from "../trpc";
import { AgentUpdateSchema, type AgentInsert } from "@packages/database/schema";
import {
   AgentSelectSchema,
   PersonaConfigSchema,
} from "@packages/database/schemas/agent";
import { getAgentContentStats } from "@packages/database/repositories/content-repository";
import { getAgentIdeasCount } from "@packages/database/repositories/ideas-repository";
import { countWords } from "@packages/utils/text";
import { z } from "zod";

export const agentRouter = router({
   transferToOrganization: organizationOwnerProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;
         if (!userId) {
            throw APIError.unauthorized("User not authenticated.");
         }
         if (!organizationId) {
            throw APIError.validation(
               "No active organization found in session.",
            );
         }
         const agent = await getAgentById(resolvedCtx.db, id);
         if (!agent) {
            throw APIError.notFound("Agent not found.");
         }
         if (agent.userId !== userId) {
            throw APIError.forbidden("You do not own this agent.");
         }
         if (agent.organizationId) {
            throw APIError.forbidden(
               "Agent is already owned by an organization.",
            );
         }
         // Optionally, you may want to check the user's role here, depending on business logic
         const updatedAgent = await updateAgent(resolvedCtx.db, id, {
            organizationId,
            updatedAt: new Date(),
         });
         return updatedAgent;
      }),
   stats: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const contents = await getAgentContentStats(resolvedCtx.db, input.id);
         const totalIdeas = await getAgentIdeasCount(resolvedCtx.db, input.id);

         const wordsWritten = countWords(
            contents.map((item) => item.body).join(" "),
         );

         const totalDraft = contents.filter(
            (item) => item.status === "draft",
         ).length;
         const totalPublished = contents.filter(
            (item) => item.status === "approved",
         ).length;
         const isNumber = (value: unknown): value is number =>
            typeof value === "number" && !Number.isNaN(value);
         const toNumber = (value: unknown): number | null => {
            const num = Number(value);
            return Number.isNaN(num) ? null : num;
         };
         const qualityScores = contents
            .map((item) => toNumber(item.stats?.qualityScore))
            .filter(isNumber);
         const avgQualityScore =
            qualityScores.length > 0
               ? qualityScores.reduce((sum, val) => sum + val, 0) /
                 qualityScores.length
               : null;

         return {
            wordsWritten,
            totalDraft,
            totalPublished,
            totalIdeas,
            avgQualityScore,
         };
      }),
   create: organizationOwnerProcedure
      .input(
         PersonaConfigSchema.omit({
            instructions: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            const userId = resolvedCtx.session?.user.id;
            if (!userId) {
               throw APIError.unauthorized(
                  "User ID is required to create an agent.",
               );
            }
            const agentData: Omit<
               AgentInsert,
               "id" | "createdAt" | "updatedAt"
            > = {
               personaConfig: input,
               userId: userId,
            };
            return await createAgent(resolvedCtx.db, { ...agentData });
         } catch (err) {
            console.log(err);
            propagateError(err);
            throw APIError.internal("Agent creation failed.");
         }
      }),
   update: protectedProcedure
      .input(
         AgentUpdateSchema.pick({
            id: true,
            personaConfig: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { id, ...updateFields } = input;
         if (!id) {
            throw APIError.validation("Agent ID is required for update.");
         }
         try {
            await updateAgent(resolvedCtx.db, id, {
               personaConfig: updateFields.personaConfig,
               updatedAt: new Date(),
            });
            return { success: true };
         } catch (err) {
            console.log(err);
            propagateError(err);
            throw APIError.internal("Agent update failed.");
         }
      }),
   delete: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { id } = input;
         try {
            await deleteAgent(resolvedCtx.db, id);
            return { success: true };
         } catch (err) {
            console.log(err);
            propagateError(err);
            throw APIError.internal("Agent deletion failed.");
         }
      }),
   get: protectedProcedure
      .input(AgentSelectSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            return await getAgentById(resolvedCtx.db, input.id);
         } catch (err) {
            console.log(err);
            propagateError(err);
            throw APIError.internal("Agent retrieval failed.");
         }
      }),
   list: protectedProcedure
      .input(
         z
            .object({
               page: z.number().min(1).default(1),
               limit: z.number().min(1).max(100).default(8),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;
            if (!userId && !organizationId) {
               throw APIError.unauthorized(
                  "User or organization ID is required to list agents.",
               );
            }

            const { page = 1, limit = 8 } = input || {};

            const [agents, total] = await Promise.all([
               listAgents(resolvedCtx.db, {
                  userId,
                  organizationId: organizationId || undefined,
                  page,
                  limit,
               }),
               getTotalAgents(resolvedCtx.db, {
                  userId,
                  organizationId: organizationId || undefined,
               }),
            ]);

            if (!agents.length) {
               console.error("No agents found");
               return { items: [], total: 0, page: 1, limit: 8, totalPages: 1 };
            }
            return {
               items: agents,
               total,
               page,
               limit,
               totalPages: Math.ceil(total / limit),
            };
         } catch (err) {
            console.log(err);
            propagateError(err);
            throw APIError.internal("No agents found.");
         }
      }),
});

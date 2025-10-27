import { agent } from "../schemas/agent";
import type { AgentSelect, AgentInsert } from "../schemas/agent";
import type { DatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";
import { eq, or, sql } from "drizzle-orm";

export async function createAgent(
   dbClient: DatabaseInstance,
   data: Omit<AgentInsert, "id" | "createdAt" | "updatedAt">,
): Promise<AgentSelect> {
   try {
      const result = await dbClient.insert(agent).values(data).returning();
      const created = result?.[0];
      if (!created) throw AppError.database("Agent not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create agent: ${(err as Error).message}`,
      );
   }
}

export async function getAgentById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<AgentSelect> {
   try {
      const result = await dbClient.query.agent.findFirst({
         where: eq(agent.id, id),
      });
      if (!result) throw AppError.database("Agent not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to get agent: ${(err as Error).message}`);
   }
}

export async function updateAgent(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<AgentInsert>,
): Promise<AgentSelect> {
   try {
      const result = await dbClient
         .update(agent)
         .set(data)
         .where(eq(agent.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Agent not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update agent: ${(err as Error).message}`,
      );
   }
}

export async function deleteAgent(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(agent)
         .where(eq(agent.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw AppError.database("Agent not found");
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete agent: ${(err as Error).message}`,
      );
   }
}

export async function listAgents(
   dbClient: DatabaseInstance,
   {
      userId,
      organizationId,
      page = 1,
      limit = 8,
   }: {
      userId?: string;
      organizationId?: string;
      page?: number;
      limit?: number;
   },
): Promise<AgentSelect[]> {
   try {
      const offset = (page - 1) * limit;

      if (userId && organizationId) {
         return await dbClient.query.agent.findMany({
            where: or(
               eq(agent.userId, userId),
               eq(agent.organizationId, organizationId),
            ),
            limit,
            offset,
            orderBy: (agent, { desc }) => [desc(agent.createdAt)],
         });
      }
      if (userId) {
         return await dbClient.query.agent.findMany({
            where: eq(agent.userId, userId),
            limit,
            offset,
            orderBy: (agent, { desc }) => [desc(agent.createdAt)],
         });
      }
      if (organizationId) {
         return await dbClient.query.agent.findMany({
            where: eq(agent.organizationId, organizationId),
            limit,
            offset,
            orderBy: (agent, { desc }) => [desc(agent.createdAt)],
         });
      }
      return [];
   } catch (err) {
      throw AppError.database(
         `Failed to list agents: ${(err as Error).message}`,
      );
   }
}

export async function getTotalAgents(
   dbClient: DatabaseInstance,
   { userId, organizationId }: { userId?: string; organizationId?: string },
): Promise<number> {
   try {
      if (userId && organizationId) {
         const result = await dbClient
            .select({ value: sql<number>`cast(count(*) as int)` })
            .from(agent)
            .where(
               or(
                  eq(agent.userId, userId),
                  eq(agent.organizationId, organizationId),
               ),
            );
         return result[0]?.value ?? 0;
      }
      if (userId) {
         const result = await dbClient
            .select({ value: sql<number>`cast(count(*) as int)` })
            .from(agent)
            .where(eq(agent.userId, userId));
         return result[0]?.value ?? 0;
      }
      if (organizationId) {
         const result = await dbClient
            .select({ value: sql<number>`cast(count(*) as int)` })
            .from(agent)
            .where(eq(agent.organizationId, organizationId));
         return result[0]?.value ?? 0;
      }
      return 0;
   } catch (err) {
      throw AppError.database(
         `Failed to get total agents: ${(err as Error).message}`,
      );
   }
}

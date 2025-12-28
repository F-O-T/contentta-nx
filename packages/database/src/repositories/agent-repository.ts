import { AppError, propagateError } from "@packages/utils/errors";
import { count, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { agent, type AgentInsert } from "../schemas/agent";

export async function createAgent(
	dbClient: DatabaseInstance,
	data: AgentInsert,
) {
	try {
		const result = await dbClient.insert(agent).values(data).returning();
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to create agent: ${(err as Error).message}`);
	}
}

export async function getAgentById(
	dbClient: DatabaseInstance,
	agentId: string,
) {
	try {
		const result = await dbClient.query.agent.findFirst({
			where: (agent, { eq }) => eq(agent.id, agentId),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to get agent: ${(err as Error).message}`);
	}
}

export async function getAgentsByOrganizationId(
	dbClient: DatabaseInstance,
	organizationId: string,
) {
	try {
		const result = await dbClient.query.agent.findMany({
			where: (agent, { eq }) => eq(agent.organizationId, organizationId),
			orderBy: (agent, { desc }) => desc(agent.createdAt),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to get agents: ${(err as Error).message}`);
	}
}

export async function updateAgent(
	dbClient: DatabaseInstance,
	agentId: string,
	data: Partial<AgentInsert>,
) {
	try {
		const result = await dbClient
			.update(agent)
			.set(data)
			.where(eq(agent.id, agentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Agent not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to update agent: ${(err as Error).message}`,
		);
	}
}

export async function deleteAgent(
	dbClient: DatabaseInstance,
	agentId: string,
) {
	try {
		const result = await dbClient
			.delete(agent)
			.where(eq(agent.id, agentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Agent not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to delete agent: ${(err as Error).message}`,
		);
	}
}

export async function updateAgentLastGenerated(
	dbClient: DatabaseInstance,
	agentId: string,
) {
	try {
		const result = await dbClient
			.update(agent)
			.set({ lastGeneratedAt: new Date() })
			.where(eq(agent.id, agentId))
			.returning();

		if (!result.length) {
			throw AppError.database("Agent not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to update agent last generated: ${(err as Error).message}`,
		);
	}
}

export async function getTotalAgents(
	dbClient: DatabaseInstance,
	options: { organizationId: string; userId?: string },
) {
	try {
		const result = await dbClient
			.select({ count: count() })
			.from(agent)
			.where(eq(agent.organizationId, options.organizationId));

		return result[0]?.count ?? 0;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get total agents: ${(err as Error).message}`,
		);
	}
}

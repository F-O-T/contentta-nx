import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
	chatSession,
	chatMessage,
	type SelectionContext,
	type StoredToolCall,
} from "../schemas/chat";

/**
 * Get or create a chat session for a content document.
 * Returns existing session if one exists, otherwise creates new.
 */
export async function getOrCreateChatSession(
	dbClient: DatabaseInstance,
	contentId: string,
	organizationId: string,
) {
	try {
		// Try to find existing session
		const existing = await dbClient.query.chatSession.findFirst({
			where: and(
				eq(chatSession.contentId, contentId),
				eq(chatSession.organizationId, organizationId),
			),
		});

		if (existing) {
			return existing;
		}

		// Create new session
		const result = await dbClient
			.insert(chatSession)
			.values({
				contentId,
				organizationId,
			})
			.returning();

		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get or create chat session: ${(err as Error).message}`,
		);
	}
}

/**
 * Get chat session by ID.
 */
export async function getChatSessionById(
	dbClient: DatabaseInstance,
	sessionId: string,
) {
	try {
		const result = await dbClient.query.chatSession.findFirst({
			where: eq(chatSession.id, sessionId),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get chat session: ${(err as Error).message}`,
		);
	}
}

/**
 * Get chat session by content ID.
 */
export async function getChatSessionByContentId(
	dbClient: DatabaseInstance,
	contentId: string,
	organizationId: string,
) {
	try {
		const result = await dbClient.query.chatSession.findFirst({
			where: and(
				eq(chatSession.contentId, contentId),
				eq(chatSession.organizationId, organizationId),
			),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get chat session by content: ${(err as Error).message}`,
		);
	}
}

/**
 * Get all messages for a chat session, ordered by creation time.
 */
export async function getChatSessionMessages(
	dbClient: DatabaseInstance,
	sessionId: string,
) {
	try {
		const result = await dbClient.query.chatMessage.findMany({
			where: eq(chatMessage.sessionId, sessionId),
			orderBy: (message, { asc }) => asc(message.createdAt),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get chat messages: ${(err as Error).message}`,
		);
	}
}

/**
 * Add a message to a chat session.
 */
export async function addChatMessage(
	dbClient: DatabaseInstance,
	sessionId: string,
	role: "user" | "assistant",
	content: string,
	selectionContext?: SelectionContext,
	toolCalls?: StoredToolCall[],
) {
	try {
		const result = await dbClient
			.insert(chatMessage)
			.values({
				sessionId,
				role,
				content,
				selectionContext,
				toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
			})
			.returning();

		// Update session's updatedAt timestamp
		await dbClient
			.update(chatSession)
			.set({ updatedAt: new Date() })
			.where(eq(chatSession.id, sessionId));

		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to add chat message: ${(err as Error).message}`,
		);
	}
}

/**
 * Clear all messages in a chat session.
 */
export async function clearChatSession(
	dbClient: DatabaseInstance,
	sessionId: string,
) {
	try {
		await dbClient
			.delete(chatMessage)
			.where(eq(chatMessage.sessionId, sessionId));

		// Update session's updatedAt timestamp
		await dbClient
			.update(chatSession)
			.set({ updatedAt: new Date() })
			.where(eq(chatSession.id, sessionId));
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to clear chat session: ${(err as Error).message}`,
		);
	}
}

/**
 * Delete a chat session and all its messages.
 */
export async function deleteChatSession(
	dbClient: DatabaseInstance,
	sessionId: string,
) {
	try {
		await dbClient.delete(chatSession).where(eq(chatSession.id, sessionId));
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to delete chat session: ${(err as Error).message}`,
		);
	}
}

/**
 * Get session with messages for a content document.
 * Returns null if no session exists.
 */
export async function getChatSessionWithMessages(
	dbClient: DatabaseInstance,
	contentId: string,
	organizationId: string,
) {
	try {
		const session = await dbClient.query.chatSession.findFirst({
			where: and(
				eq(chatSession.contentId, contentId),
				eq(chatSession.organizationId, organizationId),
			),
			with: {
				messages: {
					orderBy: (message, { asc }) => asc(message.createdAt),
				},
			},
		});
		return session;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get chat session with messages: ${(err as Error).message}`,
		);
	}
}

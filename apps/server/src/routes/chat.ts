import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import { createChatStream } from "@packages/chat/server";
import { ChatRequestSchema } from "@packages/chat/schemas";
import {
	getOrCreateChatSession,
	getChatSessionWithMessages,
	addChatMessage,
	clearChatSession,
	getChatSessionById,
} from "@packages/database/repositories/chat-repository";
import { Elysia, t } from "elysia";

export const chatRoutes = new Elysia({ prefix: "/api/chat" })
	// Stream chat completion
	.post(
		"/stream",
		async function* ({ body, request }) {
			// Validate session
			const session = await auth.api.getSession({ headers: request.headers });
			if (!session) {
				throw new Error("Unauthorized");
			}

			// Validate input
			const input = ChatRequestSchema.parse(body);

			// Get the latest user message to save
			const userMessage = input.messages[input.messages.length - 1];
			if (userMessage?.role === "user") {
				await addChatMessage(
					db,
					input.sessionId,
					"user",
					userMessage.content,
					input.selectionContext,
				);
			}

			// Accumulate assistant response for saving
			let fullResponse = "";

			// Stream chat using async generator
			for await (const chunk of createChatStream(input)) {
				if (!chunk.done) {
					fullResponse += chunk.text;
				}
				yield JSON.stringify(chunk) + "\n";
			}

			// Save assistant response to database
			if (fullResponse) {
				await addChatMessage(db, input.sessionId, "assistant", fullResponse);
			}
		},
		{
			body: t.Object({
				sessionId: t.String(),
				contentId: t.String(),
				messages: t.Array(
					t.Object({
						role: t.Union([t.Literal("user"), t.Literal("assistant")]),
						content: t.String(),
					}),
				),
				selectionContext: t.Optional(
					t.Object({
						text: t.String(),
						contextBefore: t.Optional(t.String()),
						contextAfter: t.Optional(t.String()),
					}),
				),
				documentContext: t.Optional(t.String()),
				maxTokens: t.Optional(t.Number()),
				temperature: t.Optional(t.Number()),
			}),
		},
	)

	// Get or create session for a content document
	.get(
		"/session/:contentId",
		async ({ params, request }) => {
			const session = await auth.api.getSession({ headers: request.headers });
			if (!session) {
				throw new Error("Unauthorized");
			}

			const organizationId = session.session.activeOrganizationId;
			if (!organizationId) {
				throw new Error("No active organization");
			}

			// Get or create chat session with messages
			const chatSession = await getOrCreateChatSession(
				db,
				params.contentId,
				organizationId,
			);

			const sessionWithMessages = await getChatSessionWithMessages(
				db,
				params.contentId,
				organizationId,
			);

			return {
				session: chatSession,
				messages: sessionWithMessages?.messages ?? [],
			};
		},
		{
			params: t.Object({
				contentId: t.String(),
			}),
		},
	)

	// Clear all messages in a session
	.delete(
		"/session/:sessionId",
		async ({ params, request }) => {
			const session = await auth.api.getSession({ headers: request.headers });
			if (!session) {
				throw new Error("Unauthorized");
			}

			const organizationId = session.session.activeOrganizationId;
			if (!organizationId) {
				throw new Error("No active organization");
			}

			// Verify session belongs to organization
			const chatSession = await getChatSessionById(db, params.sessionId);
			if (!chatSession || chatSession.organizationId !== organizationId) {
				throw new Error("Session not found");
			}

			await clearChatSession(db, params.sessionId);

			return { success: true };
		},
		{
			params: t.Object({
				sessionId: t.String(),
			}),
		},
	);

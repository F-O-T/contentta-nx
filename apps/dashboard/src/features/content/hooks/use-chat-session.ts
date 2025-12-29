import { useCallback, useEffect } from "react";
import { clientEnv } from "@packages/environment/client";
import {
	useChatContext,
	initializeChatSession,
	addUserMessage,
	startStreaming,
	appendStreamingContent,
	completeStreaming,
	setChatError,
	clearChat,
	setLoading,
	type ChatMessage,
} from "../context/chat-context";
import { useChatCompletion } from "./use-chat-completion";

interface ChatSessionResponse {
	session: {
		id: string;
		contentId: string;
		organizationId: string;
	};
	messages: Array<{
		id: string;
		role: "user" | "assistant";
		content: string;
		createdAt: string;
		selectionContext?: {
			text: string;
			contextBefore: string;
			contextAfter: string;
		};
	}>;
}

export function useChatSession(contentId: string) {
	const {
		phase,
		isOpen,
		sessionId,
		messages,
		currentStreamingMessage,
		selectionContext,
		error,
	} = useChatContext();

	// Chat completion hook
	const { sendMessage: sendChatMessage, cancelChat, isLoading } = useChatCompletion({
		onChunk: (text) => {
			appendStreamingContent(text);
		},
		onComplete: () => {
			completeStreaming();
		},
		onError: (error) => {
			setChatError(error);
		},
	});

	// Load session on mount or when contentId changes
	useEffect(() => {
		if (!contentId) return;

		const loadSession = async () => {
			setLoading();
			try {
				const response = await fetch(
					`${clientEnv.VITE_SERVER_URL}/api/chat/session/${contentId}`,
					{
						credentials: "include",
					},
				);

				if (!response.ok) {
					throw new Error(`Failed to load chat session: ${response.status}`);
				}

				const data: ChatSessionResponse = await response.json();

				// Transform messages to our format
				const transformedMessages: ChatMessage[] = data.messages.map((m) => ({
					id: m.id,
					role: m.role,
					content: m.content,
					timestamp: new Date(m.createdAt).getTime(),
					selectionContext: m.selectionContext,
				}));

				initializeChatSession(data.session.id, contentId, transformedMessages);
			} catch (err) {
				setChatError(
					err instanceof Error ? err : new Error("Failed to load session"),
				);
			}
		};

		loadSession();
	}, [contentId]);

	// Send a message
	const sendMessage = useCallback(
		async (content: string, documentContext?: string) => {
			if (!sessionId || !content.trim()) return;

			// Add user message to state
			addUserMessage(content);

			// Start streaming
			startStreaming();

			// Get the full message history including the new message
			const allMessages = [
				...messages.map((m) => ({ role: m.role, content: m.content })),
				{ role: "user" as const, content },
			];

			// Send to API
			await sendChatMessage({
				sessionId,
				contentId,
				messages: allMessages,
				selectionContext: selectionContext || undefined,
				documentContext,
			});
		},
		[sessionId, contentId, messages, selectionContext, sendChatMessage],
	);

	// Clear the conversation
	const clearConversation = useCallback(async () => {
		if (!sessionId) return;

		try {
			const response = await fetch(
				`${clientEnv.VITE_SERVER_URL}/api/chat/session/${sessionId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to clear chat: ${response.status}`);
			}

			clearChat();
		} catch (err) {
			setChatError(
				err instanceof Error ? err : new Error("Failed to clear chat"),
			);
		}
	}, [sessionId]);

	return {
		// State
		phase,
		isOpen,
		sessionId,
		messages,
		currentStreamingMessage,
		selectionContext,
		error,
		isLoading,
		isStreaming: phase === "streaming",

		// Actions
		sendMessage,
		cancelChat,
		clearConversation,
	};
}

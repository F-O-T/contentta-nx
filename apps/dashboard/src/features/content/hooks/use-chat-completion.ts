import { useCallback, useRef, useState, useEffect } from "react";
import { clientEnv } from "@packages/environment/client";
import type { ChatChunk } from "@packages/chat/schemas";

export interface ChatCompletionRequest {
	sessionId: string;
	contentId: string;
	messages: Array<{ role: "user" | "assistant"; content: string }>;
	selectionContext?: {
		text: string;
		contextBefore?: string;
		contextAfter?: string;
	};
	documentContext?: string;
	contentMetadata?: {
		title: string;
		description: string;
		slug: string;
		keywords?: string[];
		status: string;
	};
	mode?: "chat" | "plan" | "agent";
	maxTokens?: number;
	temperature?: number;
}

export interface UseChatCompletionOptions {
	onChunk: (text: string) => void;
	onComplete: (fullText: string) => void;
	onError: (error: Error) => void;
}

export function useChatCompletion({
	onChunk,
	onComplete,
	onError,
}: UseChatCompletionOptions) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Use refs for callbacks to avoid recreating sendMessage
	const onChunkRef = useRef(onChunk);
	const onCompleteRef = useRef(onComplete);
	const onErrorRef = useRef(onError);

	// Keep refs updated
	useEffect(() => {
		onChunkRef.current = onChunk;
		onCompleteRef.current = onComplete;
		onErrorRef.current = onError;
	}, [onChunk, onComplete, onError]);

	const cancelChat = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsLoading(false);
	}, []);

	const sendMessage = useCallback(
		async (request: ChatCompletionRequest) => {
			cancelChat();
			abortControllerRef.current = new AbortController();
			const signal = abortControllerRef.current.signal;

			setIsLoading(true);
			setError(null);
			let fullText = "";

			try {
				// Use native fetch for true streaming
				const response = await fetch(
					`${clientEnv.VITE_SERVER_URL}/api/chat/stream`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify(request),
						signal,
					},
				);

				if (!response.ok) {
					throw new Error(`Chat request failed: ${response.status}`);
				}

				if (!response.body) {
					throw new Error("No response body");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						if (signal.aborted) break;

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split("\n");
						buffer = lines.pop() || "";

						for (const line of lines) {
							if (!line.trim()) continue;
							try {
								const chunk: ChatChunk = JSON.parse(line);
								if (!chunk.done && chunk.text) {
									fullText += chunk.text;
									onChunkRef.current(chunk.text);
								}
							} catch {
								// Skip invalid JSON lines
							}
						}
					}
				} finally {
					reader.releaseLock();
				}

				if (!signal.aborted) {
					onCompleteRef.current(fullText);
				}
			} catch (err) {
				if (!signal.aborted) {
					const error = err instanceof Error ? err : new Error(String(err));
					setError(error);
					onErrorRef.current(error);
				}
			} finally {
				setIsLoading(false);
				abortControllerRef.current = null;
			}
		},
		[cancelChat],
	);

	return { sendMessage, cancelChat, isLoading, error };
}

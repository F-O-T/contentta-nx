import type { ChatChunk } from "./schemas";

export interface ChatStreamConsumerOptions {
	onChunk: (text: string) => void;
	onComplete: (fullText: string) => void;
	onError: (error: Error) => void;
	signal?: AbortSignal;
}

/**
 * Client-side utility to consume chat stream.
 * Handles chunking, completion, and errors.
 */
export async function consumeChatStream(
	stream: AsyncIterable<ChatChunk>,
	options: ChatStreamConsumerOptions,
): Promise<string> {
	const { onChunk, onComplete, onError, signal } = options;
	let fullText = "";

	try {
		for await (const chunk of stream) {
			if (signal?.aborted) {
				throw new Error("Stream aborted");
			}

			if (chunk.done) {
				onComplete(fullText);
				return fullText;
			}

			fullText += chunk.text;
			onChunk(chunk.text);
		}

		onComplete(fullText);
		return fullText;
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		onError(err);
		throw error;
	}
}

/**
 * Create an AbortController with helper for cancellation.
 */
export function createChatAbortController(): {
	controller: AbortController;
	abort: () => void;
	signal: AbortSignal;
} {
	const controller = new AbortController();

	return {
		controller,
		signal: controller.signal,
		abort: () => controller.abort(),
	};
}

/**
 * Build selection context from editor state.
 * Handles truncation for long documents.
 */
export function buildSelectionContext(
	fullText: string,
	selectionStart: number,
	selectionEnd: number,
	options?: {
		maxContextChars?: number;
	},
): {
	text: string;
	contextBefore: string;
	contextAfter: string;
} {
	const { maxContextChars = 500 } = options ?? {};

	const clampedStart = Math.max(0, selectionStart);
	const clampedEnd = Math.min(fullText.length, selectionEnd);

	const selectedText = fullText.slice(clampedStart, clampedEnd);

	let contextBefore = fullText.slice(0, clampedStart);
	if (contextBefore.length > maxContextChars) {
		contextBefore = contextBefore.slice(-maxContextChars);
		// Trim to word boundary
		const firstSpace = contextBefore.indexOf(" ");
		if (firstSpace > 0 && firstSpace < 50) {
			contextBefore = contextBefore.slice(firstSpace + 1);
		}
	}

	let contextAfter = fullText.slice(clampedEnd);
	if (contextAfter.length > maxContextChars) {
		contextAfter = contextAfter.slice(0, maxContextChars);
		// Trim to word boundary
		const lastSpace = contextAfter.lastIndexOf(" ");
		if (lastSpace > maxContextChars - 50) {
			contextAfter = contextAfter.slice(0, lastSpace);
		}
	}

	return {
		text: selectedText,
		contextBefore,
		contextAfter,
	};
}

/**
 * Format messages for display, handling markdown.
 */
export function formatMessageContent(content: string): string {
	// Basic sanitization - could be extended with markdown parsing
	return content.trim();
}

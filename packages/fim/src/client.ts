import type { FIMChunk } from "./schemas";

export interface FIMStreamConsumerOptions {
	onChunk: (text: string) => void;
	onComplete: (fullText: string) => void;
	onError: (error: Error) => void;
	signal?: AbortSignal;
}

/**
 * Client-side utility to consume FIM stream from tRPC.
 * Handles chunking, completion, and errors.
 */
export async function consumeFIMStream(
	stream: AsyncIterable<FIMChunk>,
	options: FIMStreamConsumerOptions,
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
export function createFIMAbortController(): {
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
 * Build context for FIM from document text and cursor position.
 * Handles truncation for long documents.
 */
export function buildFIMContext(
	fullText: string,
	cursorPosition: number,
	options?: {
		maxPrefixChars?: number;
		maxSuffixChars?: number;
	},
): { prefix: string; suffix: string } {
	const { maxPrefixChars = 4000, maxSuffixChars = 2000 } = options ?? {};

	const clampedPosition = Math.max(0, Math.min(cursorPosition, fullText.length));

	let prefix = fullText.slice(0, clampedPosition);
	if (prefix.length > maxPrefixChars) {
		prefix = prefix.slice(-maxPrefixChars);
		const firstSpace = prefix.indexOf(" ");
		if (firstSpace > 0 && firstSpace < 100) {
			prefix = prefix.slice(firstSpace + 1);
		}
	}

	let suffix = fullText.slice(clampedPosition);
	if (suffix.length > maxSuffixChars) {
		suffix = suffix.slice(0, maxSuffixChars);
		const lastSpace = suffix.lastIndexOf(" ");
		if (lastSpace > maxSuffixChars - 100) {
			suffix = suffix.slice(0, lastSpace);
		}
	}

	return { prefix, suffix };
}

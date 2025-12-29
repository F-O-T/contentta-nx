import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { serverEnv } from "@packages/environment/server";
import type { FIMRequest, FIMChunkEnhanced, FIMStopReason } from "./schemas";
import { FIMError } from "./errors";
import { calculateConfidence } from "./confidence";

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

// Cheap instruction-following model for document completion
const FIM_MODEL = "x-ai/grok-4.1-fast";
const MAX_CONTEXT_CHARS = 8000;

/**
 * Build a document completion prompt using instruction format.
 * Works with any instruction-following model.
 */
function buildDocumentCompletionPrompt(prefix: string, suffix: string): string {
	if (suffix && suffix.trim()) {
		return `You are a writing assistant. Continue the text naturally so it flows seamlessly into what comes after.

TEXT BEFORE CURSOR:
${prefix}

TEXT AFTER CURSOR:
${suffix}

Write ONLY the continuation (1-2 sentences). Do not repeat the prefix or include the suffix. Be concise and match the writing style.`;
	}

	// No suffix - simple autocomplete
	return `You are a writing assistant. Continue this text naturally with 1-2 sentences. Match the writing style and tone.

${prefix}

Continue (be concise):`;
}

/**
 * Map AI SDK finish reason to our stop reason enum
 */
function mapFinishReason(reason: string | undefined): FIMStopReason {
	switch (reason) {
		case "stop":
			return "natural";
		case "length":
			return "token_limit";
		case "content-filter":
			return "natural"; // Treat as natural stop
		default:
			return "stop_sequence";
	}
}

/**
 * Create an async generator for streaming document completions.
 * Yields chunks during streaming and a final chunk with confidence metadata.
 */
export async function* createFIMStream(
	request: FIMRequest,
	signal?: AbortSignal,
): AsyncGenerator<FIMChunkEnhanced> {
	const { prefix, suffix, maxTokens, temperature, stopSequences, recentText } = request;

	if (prefix.length + suffix.length > MAX_CONTEXT_CHARS) {
		throw FIMError.contextTooLong(
			`Context length ${prefix.length + suffix.length} exceeds maximum ${MAX_CONTEXT_CHARS}`,
		);
	}

	const prompt = buildDocumentCompletionPrompt(prefix, suffix);
	const startTime = Date.now();
	let fullText = "";

	try {
		const result = streamText({
			model: openrouter(FIM_MODEL),
			prompt,
			maxOutputTokens: maxTokens,
			temperature,
			stopSequences,
			abortSignal: signal,
		});

		// Stream text chunks
		for await (const chunk of result.textStream) {
			if (signal?.aborted) {
				return;
			}
			fullText += chunk;
			yield { text: chunk, done: false };
		}

		// Get finish reason and calculate metrics
		const finishReason = await result.finishReason;
		const stopReason = mapFinishReason(finishReason);
		const latencyMs = Date.now() - startTime;

		// Calculate confidence score
		const confidenceResult = calculateConfidence({
			suggestion: fullText,
			prefix,
			recentText,
			stopReason,
			latencyMs,
		});

		// Yield final chunk with metadata
		yield {
			text: "",
			done: true,
			metadata: {
				stopReason,
				latencyMs,
				confidence: confidenceResult.score,
				shouldShow: confidenceResult.shouldShow,
				factors: confidenceResult.factors,
			},
		};
	} catch (error) {
		if (signal?.aborted) {
			throw FIMError.streamAborted();
		}

		if (error instanceof Error) {
			if (error.message.includes("rate limit")) {
				throw FIMError.rateLimited();
			}
			if (error.message.includes("unavailable")) {
				throw FIMError.modelUnavailable();
			}
		}

		throw error;
	}
}

/**
 * Non-streaming document completion for simple use cases.
 */
export async function generateFIMCompletion(
	request: FIMRequest,
	signal?: AbortSignal,
): Promise<string> {
	let completion = "";

	for await (const chunk of createFIMStream(request, signal)) {
		if (!chunk.done) {
			completion += chunk.text;
		}
	}

	return completion;
}

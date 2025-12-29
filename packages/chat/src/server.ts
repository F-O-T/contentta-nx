import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { serverEnv } from "@packages/environment/server";
import type { ChatRequest } from "./schemas";
import { ChatError } from "./errors";

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

// Using the same fast model as edit feature
const CHAT_MODEL = "x-ai/grok-4.1-fast";
const MAX_MESSAGE_CHARS = 8000;
const MAX_CONTEXT_CHARS = 4000;
const MAX_SELECTION_CHARS = 4000;

/**
 * Build system prompt for the chat assistant.
 * Includes selection context and document context if provided.
 */
function buildSystemPrompt(
	selectionContext?: ChatRequest["selectionContext"],
	documentContext?: string,
): string {
	let prompt = `You are a helpful AI writing assistant for a blog post editor. Your role is to help users write, edit, and improve their content.

You can help with:
- Brainstorming ideas and outlines
- Improving writing style and tone
- Suggesting better word choices
- Fixing grammar and spelling
- Expanding on ideas
- Making content more engaging
- SEO optimization suggestions
- Generating headlines and titles

Guidelines:
- Be concise and helpful
- When suggesting edits, explain your reasoning briefly
- Match the user's writing style when possible
- If asked to write content, maintain consistency with existing content
- Use markdown formatting in your responses when appropriate`;

	if (selectionContext?.text) {
		const trimmedText = selectionContext.text.slice(0, MAX_SELECTION_CHARS);
		prompt += `\n\n---\nUSER HAS SELECTED THE FOLLOWING TEXT:\n\`\`\`\n${trimmedText}\n\`\`\``;

		if (selectionContext.contextBefore) {
			const before = selectionContext.contextBefore.slice(-500);
			prompt += `\n\nCONTEXT BEFORE SELECTION:\n${before}`;
		}

		if (selectionContext.contextAfter) {
			const after = selectionContext.contextAfter.slice(0, 500);
			prompt += `\n\nCONTEXT AFTER SELECTION:\n${after}`;
		}
	}

	if (documentContext) {
		const trimmedDoc = documentContext.slice(0, MAX_CONTEXT_CHARS);
		prompt += `\n\n---\nFULL DOCUMENT CONTEXT:\n${trimmedDoc}`;
	}

	return prompt;
}

/**
 * Create an async generator for streaming chat completions.
 */
export async function* createChatStream(
	request: ChatRequest,
	signal?: AbortSignal,
): AsyncGenerator<{ text: string; done: boolean }> {
	const {
		messages,
		selectionContext,
		documentContext,
		maxTokens,
		temperature,
	} = request;

	// Validate message length
	const totalMessageLength = messages.reduce(
		(sum, m) => sum + m.content.length,
		0,
	);
	if (totalMessageLength > MAX_MESSAGE_CHARS) {
		throw ChatError.messageTooLong(
			`Total message length ${totalMessageLength} exceeds maximum ${MAX_MESSAGE_CHARS}`,
		);
	}

	const systemPrompt = buildSystemPrompt(selectionContext, documentContext);

	const formattedMessages: Array<{
		role: "system" | "user" | "assistant";
		content: string;
	}> = [
		{ role: "system", content: systemPrompt },
		...messages.map((m) => ({
			role: m.role as "user" | "assistant",
			content: m.content,
		})),
	];

	try {
		const result = streamText({
			model: openrouter(CHAT_MODEL),
			messages: formattedMessages,
			maxOutputTokens: maxTokens,
			temperature,
			abortSignal: signal,
		});

		for await (const chunk of result.textStream) {
			if (signal?.aborted) {
				return;
			}
			yield { text: chunk, done: false };
		}

		yield { text: "", done: true };
	} catch (error) {
		if (signal?.aborted) {
			throw ChatError.streamAborted();
		}

		if (error instanceof Error) {
			if (error.message.includes("rate limit")) {
				throw ChatError.rateLimited();
			}
			if (error.message.includes("unavailable")) {
				throw ChatError.modelUnavailable();
			}
		}

		throw error;
	}
}

/**
 * Non-streaming chat for simple use cases.
 */
export async function generateChatResponse(
	request: ChatRequest,
	signal?: AbortSignal,
): Promise<string> {
	let result = "";

	for await (const chunk of createChatStream(request, signal)) {
		if (!chunk.done) {
			result += chunk.text;
		}
	}

	return result;
}

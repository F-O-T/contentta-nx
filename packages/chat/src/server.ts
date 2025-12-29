import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { serverEnv } from "@packages/environment/server";
import type { ChatRequest, ContentMetadata, ChatMode } from "./schemas";
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
 * Get mode-specific instructions for the AI.
 */
function getModeInstructions(mode: ChatMode): string {
	switch (mode) {
		case "plan":
			return `
MODE: PLAN MODE
In this mode, you should create a detailed plan before suggesting any changes.

When responding:
1. First, analyze the user's request
2. Create a numbered list of steps to accomplish the goal
3. Each step should be clear and actionable
4. Ask for confirmation before proceeding with implementation

Format your response as:
**Plan:**
1. [First step]
2. [Second step]
3. [etc.]

Wait for user approval before suggesting specific changes.`;

		case "agent":
			return `
MODE: AGENT MODE
In this mode, you should provide specific edit suggestions for the document.

When responding:
1. Identify the exact text that should be changed
2. Provide the suggested replacement text
3. Explain briefly why this change improves the content

Format your edit suggestions clearly with:
- ORIGINAL: [exact text to be replaced]
- SUGGESTED: [new text]
- REASON: [brief explanation]

Make one suggestion at a time for the user to review and accept/reject.`;

		default:
			return `
MODE: CHAT MODE
In this mode, have a natural conversation about the content.
Answer questions, discuss ideas, and provide guidance without making direct edits.`;
	}
}

/**
 * Build system prompt for the chat assistant.
 * Includes content metadata, selection context, and document context if provided.
 */
function buildSystemPrompt(
	selectionContext?: ChatRequest["selectionContext"],
	documentContext?: string,
	contentMetadata?: ContentMetadata,
	mode: ChatMode = "chat",
): string {
	let prompt = `You are a helpful AI writing assistant integrated into a blog post editor. Your role is to help users write, edit, and improve their content.

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
- Use markdown formatting in your responses when appropriate
- Reference specific parts of the document when giving feedback`;

	// Add mode-specific instructions
	prompt += getModeInstructions(mode);

	// Add content metadata context
	if (contentMetadata) {
		prompt += `\n\n---\nCONTENT BEING EDITED:`;
		prompt += `\n- Title: "${contentMetadata.title}"`;
		prompt += `\n- Description: "${contentMetadata.description}"`;
		prompt += `\n- Status: ${contentMetadata.status}`;
		if (contentMetadata.keywords?.length) {
			prompt += `\n- Target keywords: ${contentMetadata.keywords.join(", ")}`;
		}
	}

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
		prompt += `\n\n---\nCURRENT DOCUMENT CONTENT:\n${trimmedDoc}`;
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
		contentMetadata,
		mode = "chat",
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

	const systemPrompt = buildSystemPrompt(selectionContext, documentContext, contentMetadata, mode);

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

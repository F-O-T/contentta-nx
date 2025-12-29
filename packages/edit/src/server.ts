import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { serverEnv } from "@packages/environment/server";
import type { EditRequest } from "./schemas";
import { EditError } from "./errors";

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

// Using the same fast model as FIM for consistency
const EDIT_MODEL = "x-ai/grok-4.1-fast";
const MAX_SELECTION_CHARS = 4000;
const MAX_INSTRUCTION_CHARS = 500;
const MAX_CONTEXT_CHARS = 1000;

/**
 * Build an edit prompt for instruction-following model.
 * The model should output ONLY the transformed text.
 */
function buildEditPrompt(
	selectedText: string,
	instruction: string,
	contextBefore: string,
	contextAfter: string,
): string {
	const trimmedBefore = contextBefore.slice(-MAX_CONTEXT_CHARS);
	const trimmedAfter = contextAfter.slice(0, MAX_CONTEXT_CHARS);

	let prompt =
		"You are a precise text editor. Transform the SELECTED TEXT according to the user's instruction.\n\n";
	prompt += "Rules:\n";
	prompt += "1. Output ONLY the transformed text\n";
	prompt += "2. Do not include any explanations, markers, or meta-commentary\n";
	prompt += "3. Do not repeat the context before/after\n";
	prompt += "4. Match the style and tone of the surrounding text\n";
	prompt +=
		"5. If the instruction is unclear, make a reasonable interpretation\n\n";

	if (trimmedBefore) {
		prompt += `CONTEXT BEFORE (for reference only):\n${trimmedBefore}\n\n`;
	}

	prompt += `SELECTED TEXT TO TRANSFORM:\n${selectedText}\n\n`;

	if (trimmedAfter) {
		prompt += `CONTEXT AFTER (for reference only):\n${trimmedAfter}\n\n`;
	}

	prompt += `INSTRUCTION: ${instruction}\n\n`;
	prompt += "TRANSFORMED TEXT:";

	return prompt;
}

/**
 * Create an async generator for streaming edit completions.
 */
export async function* createEditStream(
	request: EditRequest,
	signal?: AbortSignal,
): AsyncGenerator<{ text: string; done: boolean }> {
	const {
		selectedText,
		instruction,
		contextBefore,
		contextAfter,
		maxTokens,
		temperature,
	} = request;

	if (selectedText.length > MAX_SELECTION_CHARS) {
		throw EditError.selectionTooLong(
			`Selection length ${selectedText.length} exceeds maximum ${MAX_SELECTION_CHARS}`,
		);
	}

	if (instruction.length > MAX_INSTRUCTION_CHARS) {
		throw EditError.instructionTooLong(
			`Instruction length ${instruction.length} exceeds maximum ${MAX_INSTRUCTION_CHARS}`,
		);
	}

	const prompt = buildEditPrompt(
		selectedText,
		instruction,
		contextBefore,
		contextAfter,
	);

	try {
		const result = streamText({
			model: openrouter(EDIT_MODEL),
			prompt,
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
			throw EditError.streamAborted();
		}

		if (error instanceof Error) {
			if (error.message.includes("rate limit")) {
				throw EditError.rateLimited();
			}
			if (error.message.includes("unavailable")) {
				throw EditError.modelUnavailable();
			}
		}

		throw error;
	}
}

/**
 * Non-streaming edit for simple use cases.
 */
export async function generateEdit(
	request: EditRequest,
	signal?: AbortSignal,
): Promise<string> {
	let result = "";

	for await (const chunk of createEditStream(request, signal)) {
		if (!chunk.done) {
			result += chunk.text;
		}
	}

	return result;
}

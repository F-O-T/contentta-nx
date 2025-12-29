import type { FIMMode } from "../context/fim-context";

interface ModeDetectionContext {
	isManualTrigger: boolean;
	isEndOfParagraph?: boolean;
	isEndOfSentence?: boolean;
}

interface ModeDetectionResult {
	mode: Exclude<FIMMode, "idle">;
	reason:
		| "manual-trigger"
		| "has-newlines"
		| "content-length"
		| "context"
		| "default";
}

const COPILOT_MAX_LENGTH = 50;
const CONTEXT_AWARE_LENGTH = 30;

/**
 * Detect which FIM mode should be used based on completion content and context.
 *
 * Rules:
 * 1. Manual trigger (Ctrl+Space) → always cursor-tab
 * 2. Multi-line content (has newlines) → cursor-tab
 * 3. Long completions (>50 chars) → cursor-tab
 * 4. End of paragraph/sentence + >30 chars → cursor-tab
 * 5. Default → copilot (inline ghost text)
 */
export function detectFIMMode(
	completion: string,
	context: ModeDetectionContext,
): ModeDetectionResult {
	// Manual trigger always uses cursor-tab mode
	if (context.isManualTrigger) {
		return { mode: "cursor-tab", reason: "manual-trigger" };
	}

	// Multi-line content uses cursor-tab
	if (completion.includes("\n")) {
		return { mode: "cursor-tab", reason: "has-newlines" };
	}

	// Long completions use cursor-tab
	if (completion.length > COPILOT_MAX_LENGTH) {
		return { mode: "cursor-tab", reason: "content-length" };
	}

	// Context-based: end of paragraph/sentence with moderate length
	if (
		(context.isEndOfParagraph || context.isEndOfSentence) &&
		completion.length > CONTEXT_AWARE_LENGTH
	) {
		return { mode: "cursor-tab", reason: "context" };
	}

	// Default to copilot mode for short inline completions
	return { mode: "copilot", reason: "default" };
}

/**
 * Detect context information from prefix text for mode switching.
 */
export function detectCompletionContext(prefix: string): {
	isEndOfParagraph: boolean;
	isEndOfSentence: boolean;
} {
	const trimmedPrefix = prefix.trimEnd();

	// End of paragraph: ends with double newline or single newline at end
	const isEndOfParagraph =
		trimmedPrefix.endsWith("\n\n") || trimmedPrefix.endsWith("\n");

	// End of sentence: ends with sentence-ending punctuation
	const isEndOfSentence = /[.!?]\s*$/.test(trimmedPrefix);

	return {
		isEndOfParagraph,
		isEndOfSentence,
	};
}

/**
 * Hook for FIM mode detection with memoization.
 * Can be used to detect mode during streaming or after completion.
 */
export function useFIMMode() {
	return {
		detectMode: detectFIMMode,
		detectContext: detectCompletionContext,
	};
}

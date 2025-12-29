import type { FIMMode } from "../context/fim-context";

interface ModeDetectionContext {
	isManualTrigger: boolean;
}

interface ModeDetectionResult {
	mode: Exclude<FIMMode, "idle">;
	reason: "manual-trigger" | "default";
}

/**
 * Detect which FIM mode should be used based on trigger type.
 *
 * Rules:
 * 1. Manual trigger (Ctrl+Space) → cursor-tab (floating panel)
 * 2. All other triggers → copilot (inline ghost text only)
 *
 * The popover should ONLY appear for manual Ctrl+Space triggers.
 * Automatic completions always use inline ghost text.
 */
export function detectFIMMode(
	_completion: string,
	context: ModeDetectionContext,
): ModeDetectionResult {
	// Manual trigger uses cursor-tab mode (floating panel)
	if (context.isManualTrigger) {
		return { mode: "cursor-tab", reason: "manual-trigger" };
	}

	// All automatic triggers use copilot mode (inline ghost text only)
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

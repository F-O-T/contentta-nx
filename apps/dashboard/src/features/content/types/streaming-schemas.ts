/**
 * Local streaming type definitions for FIM, Edit, and Chat completions.
 * These are minimal type definitions used for streaming responses.
 */

// ============================================================================
// FIM Types
// ============================================================================

export type FIMTriggerType =
	| "debounce"
	| "keystroke"
	| "cursor-move"
	| "punctuation"
	| "newline"
	| "chain"
	| "edit-prediction";

export type FIMStopReason = "natural" | "token_limit" | "stop_sequence";

export interface FIMConfidenceFactors {
	length: number;
	prefixSimilarity: number;
	stopReason: number;
	latency: number;
	repetition: number;
}

export interface FIMChunkMetadata {
	stopReason?: FIMStopReason;
	latencyMs?: number;
	confidence?: number;
	shouldShow?: boolean;
	factors?: FIMConfidenceFactors;
}

export interface FIMChunkEnhanced {
	text: string;
	done: boolean;
	metadata?: FIMChunkMetadata;
}

/**
 * Diff Suggestion for replacement mode
 */
export interface FIMDiffSuggestion {
	type: "insert" | "replace";
	original?: string;
	suggestion: string;
	replaceRange?: {
		start: number;
		end: number;
	};
}

export interface EditContext {
	intent: "continuation" | "insertion" | "correction" | "completion";
	cursorDistanceFromEnd: number;
	isInEditingMode: boolean;
	isAfterIncomplete?: boolean;
	hasSentencePattern?: boolean;
}

export interface FIMRequest {
	prefix: string;
	suffix?: string;
	contextType?: "document" | "code";
	maxTokens?: number;
	temperature?: number;
	stopSequences?: string[];
	triggerType?: FIMTriggerType;
	recentText?: string;
	cursorContext?: {
		isEndOfParagraph: boolean;
		isEndOfSentence: boolean;
		isAfterPunctuation: boolean;
	};
	editContext?: EditContext;
}

// ============================================================================
// FIM Context Builder
// ============================================================================

/**
 * Build FIM context by extracting prefix and suffix from text at cursor position.
 * Truncates to reasonable lengths for API consumption.
 */
export function buildFIMContext(
	fullText: string,
	cursorPosition: number,
	options?: { maxPrefixChars?: number; maxSuffixChars?: number },
): { prefix: string; suffix: string } {
	const { maxPrefixChars = 4000, maxSuffixChars = 2000 } = options ?? {};

	// Clamp cursor position to valid range
	const clampedPosition = Math.max(0, Math.min(cursorPosition, fullText.length));

	// Extract prefix and suffix
	let prefix = fullText.slice(0, clampedPosition);
	let suffix = fullText.slice(clampedPosition);

	// Truncate prefix from the beginning if too long
	if (prefix.length > maxPrefixChars) {
		prefix = prefix.slice(-maxPrefixChars);
		// Try to start at a word boundary
		const firstSpace = prefix.indexOf(" ");
		if (firstSpace > 0 && firstSpace < 100) {
			prefix = prefix.slice(firstSpace + 1);
		}
	}

	// Truncate suffix from the end if too long
	if (suffix.length > maxSuffixChars) {
		suffix = suffix.slice(0, maxSuffixChars);
		// Try to end at a word boundary
		const lastSpace = suffix.lastIndexOf(" ");
		if (lastSpace > suffix.length - 100 && lastSpace > 0) {
			suffix = suffix.slice(0, lastSpace);
		}
	}

	return { prefix, suffix };
}

// ============================================================================
// Edit Types
// ============================================================================

export interface EditRequest {
	selectedText: string;
	instruction: string;
	contextBefore?: string;
	contextAfter?: string;
	maxTokens?: number;
	temperature?: number;
}

export interface EditChunk {
	text: string;
	done: boolean;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatChunk {
	text: string;
	done: boolean;
}

// ============================================================================
// Meta Generation Types
// ============================================================================

export interface MetaGenerationRequest {
	type: "description" | "keywords" | "all";
	title: string;
	content: string;
	existingKeywords?: string[];
	maxTokens?: number;
	temperature?: number;
}

export interface MetaGenerationResponse {
	description?: string;
	keywords?: string[];
}

/**
 * Generate a slug from a title (non-AI, simple transformation)
 */
export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove diacritics
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 100);
}

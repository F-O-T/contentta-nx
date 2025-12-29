import type { FIMConfidenceFactors, FIMConfidenceResult, FIMStopReason } from "./schemas";

/**
 * Confidence threshold - only show suggestions at or above this score
 */
export const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Input for confidence calculation
 */
export interface ConfidenceInput {
	suggestion: string;
	prefix: string;
	recentText?: string;
	stopReason: FIMStopReason;
	latencyMs: number;
}

/**
 * Weights for each confidence factor
 */
const WEIGHTS = {
	length: 0.15,
	prefixSimilarity: 0.25,
	stopReason: 0.2,
	latency: 0.1,
	repetition: 0.3,
} as const;

/**
 * Calculate confidence score for a FIM suggestion
 * Returns score 0-1 and whether to show the suggestion
 */
export function calculateConfidence(input: ConfidenceInput): FIMConfidenceResult {
	const factors: FIMConfidenceFactors = {
		length: calculateLengthScore(input.suggestion),
		prefixSimilarity: calculatePrefixSimilarity(input.suggestion, input.prefix),
		stopReason: calculateStopReasonScore(input.stopReason),
		latency: calculateLatencyScore(input.latencyMs),
		repetition: calculateRepetitionScore(input.suggestion, input.recentText),
	};

	// Weighted average
	const score =
		factors.length * WEIGHTS.length +
		factors.prefixSimilarity * WEIGHTS.prefixSimilarity +
		factors.stopReason * WEIGHTS.stopReason +
		factors.latency * WEIGHTS.latency +
		factors.repetition * WEIGHTS.repetition;

	return {
		score,
		factors,
		shouldShow: score >= CONFIDENCE_THRESHOLD,
	};
}

/**
 * Score based on suggestion length
 * Too short = low confidence, ideal length = high confidence
 */
function calculateLengthScore(suggestion: string): number {
	const len = suggestion.trim().length;

	if (len < 3) return 0.2; // Too short to be useful
	if (len < 10) return 0.5; // Short but possibly acceptable
	if (len > 200) return 0.7; // Very long (might be cut off)
	return 1.0; // Ideal length range
}

/**
 * Score based on how well suggestion flows from prefix
 * Checks for natural continuation patterns
 */
function calculatePrefixSimilarity(suggestion: string, prefix: string): number {
	const trimmedPrefix = prefix.trim();
	const trimmedSuggestion = suggestion.trim();

	if (!trimmedSuggestion) return 0;

	// Get last word of prefix and first word of suggestion
	const lastWord = trimmedPrefix.split(/\s+/).pop()?.toLowerCase() ?? "";
	const firstWord = trimmedSuggestion.split(/\s+/)[0]?.toLowerCase() ?? "";

	// Penalize if suggestion starts with the last word of prefix (immediate repetition)
	if (lastWord && firstWord === lastWord) {
		return 0.3;
	}

	// Check for natural flow based on punctuation and capitalization
	const endsWithSentenceEnd = /[.!?]\s*$/.test(trimmedPrefix);
	const endsWithComma = /,\s*$/.test(trimmedPrefix);
	const startsCapitalized = /^[A-Z]/.test(trimmedSuggestion);
	const startsLowercase = /^[a-z]/.test(trimmedSuggestion);

	// After sentence end, expect capitalization
	if (endsWithSentenceEnd && startsCapitalized) return 1.0;
	if (endsWithSentenceEnd && startsLowercase) return 0.5;

	// After comma, expect lowercase continuation
	if (endsWithComma && startsLowercase) return 1.0;
	if (endsWithComma && startsCapitalized) return 0.6;

	// Mid-sentence continuation
	if (!endsWithSentenceEnd && startsLowercase) return 1.0;
	if (!endsWithSentenceEnd && startsCapitalized) return 0.7;

	return 0.8;
}

/**
 * Score based on why the model stopped generating
 * Natural stop = high confidence, token limit = lower
 */
function calculateStopReasonScore(reason: FIMStopReason): number {
	switch (reason) {
		case "natural":
			return 1.0; // Model naturally decided to stop
		case "stop_sequence":
			return 0.9; // Hit expected stop sequence
		case "token_limit":
			return 0.5; // Cut off mid-thought
		default:
			return 0.7;
	}
}

/**
 * Score based on response latency
 * Faster responses often indicate higher model confidence
 */
function calculateLatencyScore(latencyMs: number): number {
	if (latencyMs < 500) return 1.0; // Very fast = confident
	if (latencyMs < 1000) return 0.9;
	if (latencyMs < 2000) return 0.7;
	if (latencyMs < 3000) return 0.5;
	return 0.4; // Very slow = uncertain
}

/**
 * Score based on repetition with recent text
 * High overlap with recent text = low confidence (model is stuck in a loop)
 */
function calculateRepetitionScore(suggestion: string, recentText?: string): number {
	if (!recentText) return 1.0; // No recent text to compare

	const suggestionLower = suggestion.toLowerCase();
	const recentLower = recentText.toLowerCase();

	// Check for exact substring matches (very bad)
	if (recentLower.includes(suggestionLower) || suggestionLower.includes(recentLower)) {
		return 0.2;
	}

	// Check n-gram overlap
	const suggestionNgrams = getNgrams(suggestionLower, 4);
	const recentNgrams = getNgrams(recentLower, 4);

	if (suggestionNgrams.length === 0) return 1.0;

	const overlapCount = suggestionNgrams.filter((ng) => recentNgrams.includes(ng)).length;
	const overlapRatio = overlapCount / suggestionNgrams.length;

	// High overlap = bad (repetitive)
	// Return inverted score: 0 overlap = 1.0, 100% overlap = 0.0
	return Math.max(0, 1 - overlapRatio * 1.5); // Amplify penalty
}

/**
 * Extract n-grams (word sequences) from text
 */
function getNgrams(text: string, n: number): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	if (words.length < n) return [];

	const ngrams: string[] = [];
	for (let i = 0; i <= words.length - n; i++) {
		ngrams.push(words.slice(i, i + n).join(" "));
	}
	return ngrams;
}

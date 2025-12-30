import type { FIMDiffSuggestion } from "../types/streaming-schemas";

/**
 * Minimum overlap length to consider a replacement
 */
const MIN_OVERLAP_LENGTH = 5;

/**
 * Maximum characters to check for overlap
 */
const MAX_OVERLAP_CHECK = 50;

/**
 * Find the longest suffix of 'a' that is a prefix of 'b'
 */
function findOverlap(a: string, b: string): number {
	const maxLen = Math.min(a.length, b.length, MAX_OVERLAP_CHECK);

	for (let len = maxLen; len > 0; len--) {
		const aSuffix = a.slice(-len);
		const bPrefix = b.slice(0, len);
		if (aSuffix === bPrefix) {
			return len;
		}
	}

	return 0;
}

/**
 * Detect if a suggestion is an insertion or replacement
 *
 * Pattern 1: Suggestion starts by repeating end of prefix
 *   - The model is rewriting/improving the last phrase
 *   - Example: prefix ends with "the quick brown" and suggestion is "brown fox jumps"
 *
 * Pattern 2: Suggestion overlaps with start of suffix
 *   - The model is filling a gap that makes suffix redundant
 *   - Example: suffix starts with "over the" and suggestion ends with "over the lazy"
 */
export function detectDiffType(
	prefix: string,
	suffix: string,
	suggestion: string,
): FIMDiffSuggestion {
	const trimmedSuggestion = suggestion.trim();

	if (!trimmedSuggestion) {
		return { type: "insert", suggestion: "" };
	}

	// Pattern 1: Check if suggestion overlaps with end of prefix
	const prefixOverlap = findOverlap(prefix, trimmedSuggestion);
	if (prefixOverlap >= MIN_OVERLAP_LENGTH) {
		// This is a replacement - the model is rewriting the last phrase
		const original = prefix.slice(-prefixOverlap);
		const newContent = trimmedSuggestion.slice(prefixOverlap);

		// Only treat as replacement if there's actual new content
		if (newContent.trim().length > 0) {
			return {
				type: "replace",
				original,
				suggestion: newContent,
				replaceRange: {
					start: prefix.length - prefixOverlap,
					end: prefix.length,
				},
			};
		}
	}

	// Pattern 2: Check if suggestion overlaps with start of suffix
	const suffixOverlap = findOverlap(trimmedSuggestion, suffix);
	if (suffixOverlap >= MIN_OVERLAP_LENGTH) {
		// The suggestion makes part of suffix redundant
		return {
			type: "replace",
			original: suffix.slice(0, suffixOverlap),
			suggestion: trimmedSuggestion,
			replaceRange: {
				start: prefix.length,
				end: prefix.length + suffixOverlap,
			},
		};
	}

	// Default: simple insertion at cursor
	return {
		type: "insert",
		suggestion: trimmedSuggestion,
	};
}

/**
 * Check if a suggestion looks like it's trying to replace rather than insert
 * This is a quick heuristic check without full overlap detection
 */
export function looksLikeReplacement(prefix: string, suggestion: string): boolean {
	if (!prefix || !suggestion) return false;

	const lastWords = prefix.trim().split(/\s+/).slice(-3);
	const firstWords = suggestion.trim().split(/\s+/).slice(0, 3);

	// Check if any of the last words of prefix appear in first words of suggestion
	for (const lastWord of lastWords) {
		if (lastWord.length < 3) continue; // Skip short words
		for (const firstWord of firstWords) {
			if (firstWord.toLowerCase() === lastWord.toLowerCase()) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Apply a diff suggestion to get the final text
 */
export function applyDiffSuggestion(
	prefix: string,
	suffix: string,
	diff: FIMDiffSuggestion,
): string {
	if (diff.type === "insert") {
		return prefix + diff.suggestion + suffix;
	}

	// For replacement, use the replace range
	if (diff.replaceRange) {
		const before = prefix.slice(0, diff.replaceRange.start);
		const after =
			diff.replaceRange.end > prefix.length
				? suffix.slice(diff.replaceRange.end - prefix.length)
				: prefix.slice(diff.replaceRange.end) + suffix;

		return before + diff.suggestion + after;
	}

	// Fallback: just insert
	return prefix + diff.suggestion + suffix;
}

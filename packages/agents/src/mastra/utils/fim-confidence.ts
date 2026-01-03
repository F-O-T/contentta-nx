/**
 * FIM Confidence Scoring Algorithm
 *
 * Calculates a confidence score (0-1) for FIM completions based on multiple factors.
 * Used to filter out low-quality suggestions before showing them to the user.
 */

export type FIMStopReason = "natural" | "token_limit" | "stop_sequence";

export interface FIMConfidenceFactors {
	length: number;
	prefixSimilarity: number;
	stopReason: number;
	latency: number;
	repetition: number;
}

export interface ConfidenceInput {
	completion: string;
	prefix: string;
	recentText: string;
	latencyMs: number;
	stopReason: FIMStopReason;
	triggerType: string;
}

export interface ConfidenceResult {
	score: number;
	factors: FIMConfidenceFactors;
	shouldShow: boolean;
}

/**
 * Calculate confidence score for a FIM completion
 * Score range: 0.0 to 1.0
 * Default threshold for showing: >= 0.6
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
	const { completion, prefix, recentText, latencyMs, stopReason, triggerType } =
		input;

	const factors: FIMConfidenceFactors = {
		length: scoreLengthFactor(completion),
		prefixSimilarity: scoreStyleMatch(completion, prefix),
		stopReason: scoreStopReason(stopReason),
		latency: scoreLatency(latencyMs),
		repetition: scoreRepetition(completion, recentText, prefix),
	};

	// Weighted average (repetition has highest weight)
	const score =
		factors.length * 0.15 +
		factors.prefixSimilarity * 0.25 +
		factors.stopReason * 0.2 +
		factors.latency * 0.1 +
		factors.repetition * 0.3;

	// Adjust threshold based on trigger type
	let threshold = 0.6;
	if (triggerType === "chain") threshold = 0.65;
	if (triggerType === "punctuation") threshold = 0.55;

	return {
		score: Math.max(0, Math.min(1, score)),
		factors,
		shouldShow: score >= threshold,
	};
}

/**
 * Score based on completion length
 * Optimal: 20-150 chars for prose
 */
function scoreLengthFactor(completion: string): number {
	const len = completion.length;

	if (len < 5) return 0;
	if (len < 10) return 0.3;
	if (len < 20) return 0.6;
	if (len <= 150) return 1.0;
	if (len <= 250) return 0.8;
	return 0.5; // Too long might be rambling
}

/**
 * Score based on style matching with prefix
 * Checks for word repetition at boundary, filler phrases, length consistency
 */
function scoreStyleMatch(completion: string, prefix: string): number {
	let score = 1.0;

	// 1. Check for word repetition at boundary
	const prefixWords = prefix.toLowerCase().split(/\s+/).slice(-5);
	const completionWords = completion.toLowerCase().split(/\s+/).slice(0, 3);

	for (const word of completionWords) {
		if (word.length > 3 && prefixWords.includes(word)) {
			score -= 0.15;
		}
	}

	// 2. Check sentence length consistency
	const prefixSentences = prefix.split(/[.!?]+/).filter((s) => s.trim());
	const avgPrefixSentenceLen =
		prefixSentences.length > 0
			? prefixSentences.reduce((sum, s) => sum + s.length, 0) /
				prefixSentences.length
			: 50;

	const lengthRatio = completion.length / avgPrefixSentenceLen;
	if (lengthRatio > 3 || lengthRatio < 0.2) {
		score -= 0.2;
	}

	// 3. Check for generic filler phrases
	const fillerPatterns = [
		/^as we can see/i,
		/^it's important to note/i,
		/^in conclusion/i,
		/^to summarize/i,
		/^essentially/i,
		/^basically/i,
	];

	for (const pattern of fillerPatterns) {
		if (pattern.test(completion.trim())) {
			score -= 0.2;
		}
	}

	return Math.max(0, Math.min(1, score));
}

/**
 * Score based on how the completion ended
 */
function scoreStopReason(stopReason: FIMStopReason): number {
	switch (stopReason) {
		case "natural":
			return 1.0; // Best - model chose to stop
		case "stop_sequence":
			return 0.8; // Good - hit punctuation/newline
		case "token_limit":
			return 0.4; // Might be cut off mid-thought
		default:
			return 0.5;
	}
}

/**
 * Score based on response latency
 * Faster is better for UX
 */
function scoreLatency(latencyMs: number): number {
	if (latencyMs < 200) return 1.0;
	if (latencyMs < 500) return 0.9;
	if (latencyMs < 1000) return 0.7;
	if (latencyMs < 2000) return 0.5;
	return 0.3;
}

/**
 * Score based on repetition detection
 * Higher score = less repetition (good)
 */
function scoreRepetition(
	completion: string,
	recentText: string,
	prefix: string,
): number {
	let score = 1.0;
	const completionLower = completion.toLowerCase();
	const recentLower = (recentText || prefix.slice(-200)).toLowerCase();

	// Extract and compare 3-5 word phrases
	const completionPhrases = extractPhrases(completionLower);
	const recentPhrases = extractPhrases(recentLower);

	for (const phrase of completionPhrases) {
		if (recentPhrases.includes(phrase)) {
			score -= 0.3;
		}
	}

	// Check n-gram overlap
	const completionNgrams = getNgrams(completionLower, 3);
	const recentNgrams = getNgrams(recentLower, 3);

	let overlapCount = 0;
	for (const ngram of completionNgrams) {
		if (recentNgrams.has(ngram)) overlapCount++;
	}

	const overlapRatio =
		completionNgrams.size > 0 ? overlapCount / completionNgrams.size : 0;

	if (overlapRatio > 0.3) score -= 0.3;
	else if (overlapRatio > 0.15) score -= 0.15;

	return Math.max(0, Math.min(1, score));
}

/**
 * Extract 3-5 word phrases from text
 */
function extractPhrases(text: string): string[] {
	const words = text.split(/\s+/);
	const phrases: string[] = [];

	for (let len = 3; len <= 5; len++) {
		for (let i = 0; i <= words.length - len; i++) {
			const phrase = words.slice(i, i + len).join(" ");
			if (phrase.length > 10) phrases.push(phrase);
		}
	}
	return phrases;
}

/**
 * Get n-grams (word sequences) from text
 */
function getNgrams(text: string, n: number): Set<string> {
	const words = text.split(/\s+/);
	const ngrams = new Set<string>();
	for (let i = 0; i <= words.length - n; i++) {
		ngrams.add(words.slice(i, i + n).join(" "));
	}
	return ngrams;
}

import { Store, useStore } from "@tanstack/react-store";

/**
 * Record of a recent edit for pattern learning
 */
interface EditRecord {
	before: string;
	after: string;
	position: number;
	timestamp: number;
}

/**
 * State for tracking writing patterns
 */
interface PatternState {
	// Recent sentence structures (for pattern matching)
	recentSentencePatterns: string[];

	// Typing rhythm for momentum detection
	keystrokeTimestamps: number[];

	// Edit history for learning
	recentEdits: EditRecord[];

	// Text snapshot for change detection
	lastTextSnapshot: string;
	lastCursorPosition: number;
}

const MAX_SENTENCE_PATTERNS = 10;
const MAX_KEYSTROKE_TIMESTAMPS = 20;
const MAX_EDIT_RECORDS = 10;

const initialState: PatternState = {
	recentSentencePatterns: [],
	keystrokeTimestamps: [],
	recentEdits: [],
	lastTextSnapshot: "",
	lastCursorPosition: 0,
};

const patternStore = new Store<PatternState>(initialState);

// ============================================================================
// Actions
// ============================================================================

/**
 * Record a keystroke timestamp for typing speed analysis
 */
export const recordKeystroke = () =>
	patternStore.setState((state) => ({
		...state,
		keystrokeTimestamps: [
			...state.keystrokeTimestamps.slice(-MAX_KEYSTROKE_TIMESTAMPS + 1),
			Date.now(),
		],
	}));

/**
 * Record a completed sentence pattern
 */
export const recordSentencePattern = (pattern: string) =>
	patternStore.setState((state) => ({
		...state,
		recentSentencePatterns: [
			pattern,
			...state.recentSentencePatterns.slice(0, MAX_SENTENCE_PATTERNS - 1),
		],
	}));

/**
 * Record an edit for pattern learning
 */
export const recordEdit = (edit: Omit<EditRecord, "timestamp">) =>
	patternStore.setState((state) => ({
		...state,
		recentEdits: [
			{ ...edit, timestamp: Date.now() },
			...state.recentEdits.slice(0, MAX_EDIT_RECORDS - 1),
		],
	}));

/**
 * Update text snapshot and cursor position
 */
export const updateSnapshot = (text: string, cursorPosition: number) =>
	patternStore.setState((state) => ({
		...state,
		lastTextSnapshot: text,
		lastCursorPosition: cursorPosition,
	}));

/**
 * Clear all pattern data
 */
export const clearPatterns = () =>
	patternStore.setState(() => ({ ...initialState }));

// ============================================================================
// Computed Values
// ============================================================================

/**
 * Calculate typing speed from recent keystrokes
 * Returns: 'fast' | 'normal' | 'slow' | 'paused'
 */
export function calculateTypingSpeed(
	timestamps: number[],
): "fast" | "normal" | "slow" | "paused" {
	if (timestamps.length < 2) return "paused";

	const now = Date.now();
	const lastKeystroke = timestamps[timestamps.length - 1];

	// Check if user has paused
	if (lastKeystroke === undefined || now - lastKeystroke > 500) return "paused";

	// Calculate average interval between last 5 keystrokes
	const recentTimestamps = timestamps.slice(-5);
	if (recentTimestamps.length < 2) return "normal";

	let totalInterval = 0;
	for (let i = 1; i < recentTimestamps.length; i++) {
		const current = recentTimestamps[i];
		const previous = recentTimestamps[i - 1];
		if (current !== undefined && previous !== undefined) {
			totalInterval += current - previous;
		}
	}
	const avgInterval = totalInterval / (recentTimestamps.length - 1);

	// Classify typing speed
	if (avgInterval < 100) return "fast"; // >10 chars/sec
	if (avgInterval < 200) return "normal"; // 5-10 chars/sec
	return "slow"; // <5 chars/sec
}

/**
 * Check if user is in "editing mode" vs "writing mode"
 * Based on recent edits and cursor movements
 */
export function isInEditingMode(edits: EditRecord[]): boolean {
	if (edits.length < 2) return false;

	const recentEdits = edits.filter(
		(e) => Date.now() - e.timestamp < 10000, // Last 10 seconds
	);

	// Multiple edits in short time suggests editing mode
	return recentEdits.length >= 3;
}

/**
 * Extract sentence template from text
 * Replaces words with placeholders to find patterns
 */
export function extractSentenceTemplate(sentence: string): string {
	// Simple template: replace words with W, keep punctuation
	return sentence
		.trim()
		.replace(/\b\w+\b/g, "W")
		.replace(/\s+/g, " ");
}

/**
 * Check if current sentence matches a recent pattern
 */
export function matchesSentencePattern(
	currentSentence: string,
	patterns: string[],
): boolean {
	const currentTemplate = extractSentenceTemplate(currentSentence);

	for (const pattern of patterns) {
		// Check for template match
		if (pattern === currentTemplate) return true;

		// Check for prefix match (user typing similar structure)
		if (pattern.startsWith(currentTemplate) && currentTemplate.length > 5) {
			return true;
		}
	}

	return false;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access pattern state
 */
export const usePatternContext = () => {
	const state = useStore(patternStore);

	const typingSpeed = calculateTypingSpeed(state.keystrokeTimestamps);
	const editingMode = isInEditingMode(state.recentEdits);

	return {
		...state,
		typingSpeed,
		editingMode,
		// Actions
		recordKeystroke,
		recordSentencePattern,
		recordEdit,
		updateSnapshot,
		clearPatterns,
		// Utilities
		matchesSentencePattern: (sentence: string) =>
			matchesSentencePattern(sentence, state.recentSentencePatterns),
	};
};

/**
 * Get current pattern state synchronously
 */
export const getPatternState = () => patternStore.state;

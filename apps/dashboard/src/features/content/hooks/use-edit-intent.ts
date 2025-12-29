import { useCallback, useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_LOW,
	KEY_DOWN_COMMAND,
	SELECTION_CHANGE_COMMAND,
	type LexicalNode,
} from "lexical";
import {
	usePatternContext,
	calculateTypingSpeed,
	matchesSentencePattern,
	extractSentenceTemplate,
} from "../context/pattern-context";
import { $isGhostTextNode } from "../nodes/ghost-text-node";

// ============================================================================
// Types
// ============================================================================

export type EditIntentType =
	| "continuation" // User is continuing to write at end
	| "insertion" // User is inserting text mid-document
	| "correction" // User is correcting/fixing text
	| "completion"; // User is completing an incomplete thought

export interface CursorSignal {
	isAtEnd: boolean;
	isMidText: boolean;
	isAfterIncomplete: boolean;
	distanceFromEnd: number; // 0-1, normalized
	cursorOffset: number;
	textLength: number;
}

export interface PatternSignal {
	hasSentencePattern: boolean;
	hasWordRepetition: boolean;
	paragraphConsistency: number; // 0-1
	currentSentence: string;
}

export interface MomentumSignal {
	typingSpeed: "fast" | "normal" | "slow" | "paused";
	recentEditCount: number;
	isInEditingMode: boolean;
	timeSinceLastKeystroke: number;
}

export interface EditIntent {
	type: EditIntentType;
	confidence: number; // 0-1
	signals: {
		cursor: CursorSignal;
		pattern: PatternSignal;
		momentum: MomentumSignal;
	};
	shouldTrigger: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const EDIT_PREDICTION_MIN_CONFIDENCE = 0.7;
const MID_TEXT_THRESHOLD = 0.85; // Consider cursor "mid-text" if < 85% through document
const INCOMPLETE_SENTENCE_PATTERNS = [
	/\b(the|a|an|this|that|these|those)\s*$/i,
	/\b(is|are|was|were|will|would|could|should|can|may|might)\s*$/i,
	/\b(and|but|or|so|because|although|when|if|while)\s*$/i,
	/,\s*$/,
	/:\s*$/,
];

// ============================================================================
// Signal Detection Functions
// ============================================================================

/**
 * Analyze cursor position to determine edit intent signals
 */
function analyzeCursorPosition(
	cursorOffset: number,
	textLength: number,
	textContent: string,
): CursorSignal {
	const distanceFromEnd =
		textLength > 0 ? (textLength - cursorOffset) / textLength : 0;
	const isAtEnd = cursorOffset >= textLength - 1;
	const isMidText = distanceFromEnd > 1 - MID_TEXT_THRESHOLD && !isAtEnd;

	// Check if cursor is after an incomplete thought
	const textBeforeCursor = textContent.slice(0, cursorOffset);
	const isAfterIncomplete = INCOMPLETE_SENTENCE_PATTERNS.some((pattern) =>
		pattern.test(textBeforeCursor),
	);

	return {
		isAtEnd,
		isMidText,
		isAfterIncomplete,
		distanceFromEnd,
		cursorOffset,
		textLength,
	};
}

/**
 * Analyze text patterns around cursor
 */
function analyzePatterns(
	textBeforeCursor: string,
	recentSentencePatterns: string[],
): PatternSignal {
	// Extract current sentence (text after last sentence-ending punctuation)
	const lastSentenceEnd = Math.max(
		textBeforeCursor.lastIndexOf("."),
		textBeforeCursor.lastIndexOf("!"),
		textBeforeCursor.lastIndexOf("?"),
	);
	const currentSentence =
		lastSentenceEnd >= 0
			? textBeforeCursor.slice(lastSentenceEnd + 1).trim()
			: textBeforeCursor.trim();

	// Check for sentence pattern match
	const hasSentencePattern = matchesSentencePattern(
		currentSentence,
		recentSentencePatterns,
	);

	// Check for word repetition (potential typo correction)
	const words = currentSentence.toLowerCase().split(/\s+/);
	const wordSet = new Set(words);
	const hasWordRepetition = words.length > wordSet.size;

	// Paragraph consistency (simple heuristic based on sentence length variation)
	const sentences = textBeforeCursor.split(/[.!?]+/).filter((s) => s.trim());
	let paragraphConsistency = 0.5; // Default
	if (sentences.length >= 2) {
		const lengths = sentences.map((s) => s.trim().length);
		const avgLength =
			lengths.reduce((a, b) => a + b, 0) / lengths.length;
		const variance =
			lengths.reduce((sum, len) => sum + (len - avgLength) ** 2, 0) /
			lengths.length;
		const stdDev = Math.sqrt(variance);
		// Lower variance = higher consistency
		paragraphConsistency = Math.max(0, 1 - stdDev / avgLength);
	}

	return {
		hasSentencePattern,
		hasWordRepetition,
		paragraphConsistency,
		currentSentence,
	};
}

/**
 * Analyze typing momentum
 */
function analyzeMomentum(
	keystrokeTimestamps: number[],
	recentEdits: { timestamp: number }[],
): MomentumSignal {
	const now = Date.now();
	const typingSpeed = calculateTypingSpeed(keystrokeTimestamps);

	// Count recent edits (last 10 seconds)
	const recentEditCount = recentEdits.filter(
		(e) => now - e.timestamp < 10000,
	).length;

	// Determine if in editing mode
	const isInEditingMode = recentEditCount >= 3;

	// Time since last keystroke
	const lastKeystroke = keystrokeTimestamps[keystrokeTimestamps.length - 1] ?? 0;
	const timeSinceLastKeystroke = now - lastKeystroke;

	return {
		typingSpeed,
		recentEditCount,
		isInEditingMode,
		timeSinceLastKeystroke,
	};
}

/**
 * Classify edit intent based on signals
 */
function classifyIntent(
	cursor: CursorSignal,
	pattern: PatternSignal,
	momentum: MomentumSignal,
): { type: EditIntentType; confidence: number } {
	// Calculate confidence scores for each intent type
	const scores: Record<EditIntentType, number> = {
		continuation: 0,
		insertion: 0,
		correction: 0,
		completion: 0,
	};

	// Continuation: cursor at end, fast/normal typing, no editing mode
	if (cursor.isAtEnd) {
		scores.continuation += 0.4;
		if (momentum.typingSpeed === "fast") scores.continuation += 0.3;
		if (momentum.typingSpeed === "normal") scores.continuation += 0.2;
		if (!momentum.isInEditingMode) scores.continuation += 0.2;
	}

	// Insertion: cursor mid-text, paused typing
	if (cursor.isMidText) {
		scores.insertion += 0.4;
		if (momentum.typingSpeed === "paused") scores.insertion += 0.3;
		if (momentum.timeSinceLastKeystroke > 500) scores.insertion += 0.2;
	}

	// Correction: word repetition detected, slow/paused typing
	if (pattern.hasWordRepetition) {
		scores.correction += 0.4;
		if (momentum.typingSpeed === "slow") scores.correction += 0.3;
		if (momentum.isInEditingMode) scores.correction += 0.2;
	}

	// Completion: after incomplete thought, pattern match
	if (cursor.isAfterIncomplete) {
		scores.completion += 0.4;
		if (pattern.hasSentencePattern) scores.completion += 0.3;
		if (momentum.typingSpeed === "paused") scores.completion += 0.2;
	}

	// Find the highest scoring intent
	let maxType: EditIntentType = "continuation";
	let maxScore = 0;

	for (const [type, score] of Object.entries(scores)) {
		if (score > maxScore) {
			maxScore = score;
			maxType = type as EditIntentType;
		}
	}

	// Normalize confidence to 0-1
	const confidence = Math.min(1, maxScore);

	return { type: maxType, confidence };
}

// ============================================================================
// Hook
// ============================================================================

interface UseEditIntentOptions {
	enabled?: boolean;
	minConfidence?: number;
}

/**
 * Hook to detect user's edit intent based on cursor, patterns, and momentum
 */
export function useEditIntent(options: UseEditIntentOptions = {}) {
	const { enabled = true, minConfidence = EDIT_PREDICTION_MIN_CONFIDENCE } =
		options;

	const [editor] = useLexicalComposerContext();
	const patternContext = usePatternContext();

	const intentRef = useRef<EditIntent>({
		type: "continuation",
		confidence: 0,
		signals: {
			cursor: {
				isAtEnd: true,
				isMidText: false,
				isAfterIncomplete: false,
				distanceFromEnd: 0,
				cursorOffset: 0,
				textLength: 0,
			},
			pattern: {
				hasSentencePattern: false,
				hasWordRepetition: false,
				paragraphConsistency: 0.5,
				currentSentence: "",
			},
			momentum: {
				typingSpeed: "paused",
				recentEditCount: 0,
				isInEditingMode: false,
				timeSinceLastKeystroke: 0,
			},
		},
		shouldTrigger: false,
	});

	/**
	 * Analyze current editor state and update intent
	 */
	const analyzeIntent = useCallback(() => {
		if (!enabled) return intentRef.current;

		let intent = intentRef.current;

		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			// Get text content without ghost nodes
			const root = $getRoot();
			let textContent = "";
			let cursorOffset = 0;

			const walkNode = (node: LexicalNode, beforeCursor: boolean): boolean => {
				if ($isGhostTextNode(node)) return beforeCursor;

				if ($isTextNode(node)) {
					const nodeText = node.getTextContent();

					if (node.is(selection.anchor.getNode())) {
						// This is the node containing the cursor
						textContent += nodeText;
						cursorOffset = textContent.length - nodeText.length + selection.anchor.offset;
						return false; // Now we're after cursor
					}

					textContent += nodeText;
					return beforeCursor;
				}

				if ("getChildren" in node) {
					const children = (
						node as { getChildren: () => LexicalNode[] }
					).getChildren();
					let stillBeforeCursor = beforeCursor;
					for (const child of children) {
						stillBeforeCursor = walkNode(child, stillBeforeCursor);
					}
					return stillBeforeCursor;
				}

				return beforeCursor;
			};

			walkNode(root, true);

			const textLength = textContent.length;
			const textBeforeCursor = textContent.slice(0, cursorOffset);

			// Analyze signals
			const cursorSignal = analyzeCursorPosition(
				cursorOffset,
				textLength,
				textContent,
			);
			const patternSignal = analyzePatterns(
				textBeforeCursor,
				patternContext.recentSentencePatterns,
			);
			const momentumSignal = analyzeMomentum(
				patternContext.keystrokeTimestamps,
				patternContext.recentEdits,
			);

			// Classify intent
			const { type, confidence } = classifyIntent(
				cursorSignal,
				patternSignal,
				momentumSignal,
			);

			intent = {
				type,
				confidence,
				signals: {
					cursor: cursorSignal,
					pattern: patternSignal,
					momentum: momentumSignal,
				},
				shouldTrigger: confidence >= minConfidence,
			};

			intentRef.current = intent;
		});

		return intent;
	}, [editor, enabled, minConfidence, patternContext]);

	// Record keystrokes for momentum tracking
	useEffect(() => {
		if (!enabled) return;

		return editor.registerCommand(
			KEY_DOWN_COMMAND,
			(event: KeyboardEvent) => {
				// Only track actual character input
				if (event.ctrlKey || event.metaKey || event.altKey) return false;
				if (event.key.length > 1 && event.key !== "Enter") return false;

				patternContext.recordKeystroke();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, enabled, patternContext]);

	// Update intent on selection change
	useEffect(() => {
		if (!enabled) return;

		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				analyzeIntent();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, enabled, analyzeIntent]);

	return {
		getIntent: analyzeIntent,
		intent: intentRef.current,
	};
}

/**
 * Record a completed sentence pattern for learning
 */
export function recordSentenceCompletion(sentence: string) {
	const template = extractSentenceTemplate(sentence);
	if (template.length > 5) {
		// Only record meaningful patterns
		const { recordSentencePattern } = usePatternContext();
		recordSentencePattern(template);
	}
}

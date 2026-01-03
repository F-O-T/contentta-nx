import { useCallback, useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	KEY_DOWN_COMMAND,
	SELECTION_CHANGE_COMMAND,
	type LexicalEditor,
} from "lexical";
import type { FIMTriggerType } from "../types/streaming-schemas";

/**
 * Context about where the cursor is when a trigger fires
 */
export interface TriggerContext {
	cursorOffset: number;
	isEndOfParagraph: boolean;
	isEndOfSentence: boolean;
	isAfterPunctuation: boolean;
	lastChar?: string;
}

/**
 * Configuration for trigger behavior
 */
interface TriggerConfig {
	debounceMs: number;
	enableCursorMove: boolean;
	cursorMoveDebounceMs: number;
	enablePunctuation: boolean;
	punctuationDelayMs: number;
	enableNewline: boolean;
	newlineDelayMs: number;
	enableChain: boolean;
	// Edit prediction settings
	enableEditPrediction: boolean;
	editPredictionDelayMs: number;
}

const DEFAULT_CONFIG: TriggerConfig = {
	debounceMs: 600, // Increased from 500 - more thinking time for prose
	enableCursorMove: true,
	cursorMoveDebounceMs: 400, // Increased from 300 - more reading time
	enablePunctuation: true,
	punctuationDelayMs: 150, // Increased from 100 - allow for abbreviations
	enableNewline: true,
	newlineDelayMs: 100, // Increased from 50
	enableChain: true,
	// Edit prediction defaults
	enableEditPrediction: true,
	editPredictionDelayMs: 700, // Increased from 600
};

interface UseFIMTriggersOptions {
	onTrigger: (type: FIMTriggerType, context: TriggerContext) => void;
	config?: Partial<TriggerConfig>;
	enabled?: boolean;
}

/**
 * Get cursor context from editor state
 */
function getContextFromEditor(editor: LexicalEditor): TriggerContext {
	let context: TriggerContext = {
		cursorOffset: 0,
		isEndOfParagraph: false,
		isEndOfSentence: false,
		isAfterPunctuation: false,
	};

	editor.getEditorState().read(() => {
		const selection = $getSelection();
		if (!$isRangeSelection(selection)) return;

		const anchor = selection.anchor;
		const node = anchor.getNode();
		const textContent = node.getTextContent();
		const offset = anchor.offset;

		// Calculate cursor position
		context.cursorOffset = offset;

		// Get character before cursor
		if (offset > 0) {
			context.lastChar = textContent[offset - 1];
			context.isAfterPunctuation = /[.!?,;:]/.test(context.lastChar ?? "");
			context.isEndOfSentence = /[.!?]/.test(context.lastChar ?? "");
		}

		// Check if at end of paragraph (cursor at end of text node)
		context.isEndOfParagraph = offset === textContent.length;
	});

	return context;
}

/**
 * Hook to manage FIM trigger events
 * Handles debounce, cursor-move, punctuation, newline, and chain triggers
 */
export function useFIMTriggers({
	onTrigger,
	config: userConfig,
	enabled = true,
}: UseFIMTriggersOptions) {
	const [editor] = useLexicalComposerContext();
	const config = { ...DEFAULT_CONFIG, ...userConfig };

	// Refs for debouncing
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cursorMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const editPredictionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastSelectionRef = useRef<string>("");
	const lastCursorPositionRef = useRef<number>(-1);

	// Clear debounce timer
	const clearDebounce = useCallback(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}
	}, []);

	// Schedule debounce trigger
	const scheduleDebounceTrigger = useCallback(
		(context: TriggerContext) => {
			clearDebounce();

			debounceTimerRef.current = setTimeout(() => {
				onTrigger("debounce", context);
			}, config.debounceMs);
		},
		[config.debounceMs, onTrigger, clearDebounce],
	);

	// Handle punctuation trigger
	const checkPunctuationTrigger = useCallback(
		(char: string, context: TriggerContext): boolean => {
			if (!config.enablePunctuation) return false;

			// Trigger after sentence-ending punctuation
			if ([".", "!", "?"].includes(char)) {
				// Small delay to allow for abbreviations like "Dr." or "e.g."
				setTimeout(() => {
					onTrigger("punctuation", context);
				}, config.punctuationDelayMs);
				return true;
			}
			return false;
		},
		[config.enablePunctuation, config.punctuationDelayMs, onTrigger],
	);

	// Handle newline trigger
	const checkNewlineTrigger = useCallback(
		(key: string, context: TriggerContext): boolean => {
			if (!config.enableNewline) return false;

			if (key === "Enter") {
				setTimeout(() => {
					onTrigger("newline", context);
				}, config.newlineDelayMs);
				return true;
			}
			return false;
		},
		[config.enableNewline, config.newlineDelayMs, onTrigger],
	);

	// Register key listener for punctuation, newline, and general typing
	useEffect(() => {
		if (!enabled) return;

		return editor.registerCommand(
			KEY_DOWN_COMMAND,
			(event: KeyboardEvent) => {
				// Ignore modifier keys and special keys
				if (event.ctrlKey || event.metaKey || event.altKey) return false;
				if (event.key.length > 1 && event.key !== "Enter") return false;

				const context = getContextFromEditor(editor);

				// Check for newline trigger first
				if (checkNewlineTrigger(event.key, context)) {
					clearDebounce(); // Cancel pending debounce
					return false;
				}

				// Check for punctuation trigger
				if (checkPunctuationTrigger(event.key, context)) {
					clearDebounce(); // Cancel pending debounce
					return false;
				}

				// Schedule debounce for regular typing
				scheduleDebounceTrigger(context);

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [
		editor,
		enabled,
		checkNewlineTrigger,
		checkPunctuationTrigger,
		scheduleDebounceTrigger,
		clearDebounce,
	]);

	// Register cursor move listener
	useEffect(() => {
		if (!enabled || !config.enableCursorMove) return;

		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				// Get current selection key and cursor offset
				let selectionKey = "";
				let cursorOffset = 0;
				let textLength = 0;

				editor.getEditorState().read(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						selectionKey = `${selection.anchor.key}:${selection.anchor.offset}`;
						cursorOffset = selection.anchor.offset;
						
						// Get text length for mid-text detection
						const node = selection.anchor.getNode();
						textLength = node.getTextContent().length;
					}
				});

				// Skip if selection hasn't actually changed
				if (selectionKey === lastSelectionRef.current) return false;
				lastSelectionRef.current = selectionKey;

				// Debounce cursor moves to avoid spam
				if (cursorMoveTimerRef.current) {
					clearTimeout(cursorMoveTimerRef.current);
				}

				cursorMoveTimerRef.current = setTimeout(() => {
					const context = getContextFromEditor(editor);
					onTrigger("cursor-move", context);
				}, config.cursorMoveDebounceMs);

				// Check for edit prediction trigger (cursor moved to mid-text)
				if (config.enableEditPrediction) {
					const isMidText = textLength > 0 && cursorOffset < textLength * 0.85;
					const cursorMoved = lastCursorPositionRef.current !== cursorOffset;
					lastCursorPositionRef.current = cursorOffset;

					if (isMidText && cursorMoved) {
						// Clear existing edit prediction timer
						if (editPredictionTimerRef.current) {
							clearTimeout(editPredictionTimerRef.current);
						}

						// Schedule edit prediction trigger
						editPredictionTimerRef.current = setTimeout(() => {
							const context = getContextFromEditor(editor);
							onTrigger("edit-prediction", context);
						}, config.editPredictionDelayMs);
					}
				}

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, enabled, config.enableCursorMove, config.enableEditPrediction, config.cursorMoveDebounceMs, config.editPredictionDelayMs, onTrigger]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
			if (cursorMoveTimerRef.current) clearTimeout(cursorMoveTimerRef.current);
			if (editPredictionTimerRef.current) clearTimeout(editPredictionTimerRef.current);
		};
	}, []);

	// Manual chain trigger (called externally after accept)
	const triggerChain = useCallback(() => {
		if (!config.enableChain) return;

		const context = getContextFromEditor(editor);
		onTrigger("chain", context);
	}, [editor, config.enableChain, onTrigger]);

	// Manual edit prediction trigger
	const triggerEditPrediction = useCallback(() => {
		if (!config.enableEditPrediction) return;

		const context = getContextFromEditor(editor);
		onTrigger("edit-prediction", context);
	}, [editor, config.enableEditPrediction, onTrigger]);

	// Cancel all pending triggers
	const cancelTriggers = useCallback(() => {
		clearDebounce();
		if (cursorMoveTimerRef.current) {
			clearTimeout(cursorMoveTimerRef.current);
			cursorMoveTimerRef.current = null;
		}
		if (editPredictionTimerRef.current) {
			clearTimeout(editPredictionTimerRef.current);
			editPredictionTimerRef.current = null;
		}
	}, [clearDebounce]);

	return {
		triggerChain,
		triggerEditPrediction,
		cancelTriggers,
		scheduleDebounceTrigger: (context: TriggerContext) => scheduleDebounceTrigger(context),
	};
}

import { useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	$isElementNode,
	$createRangeSelection,
	$setSelection,
	type LexicalNode,
	type TextNode,
} from "lexical";
import { $isGhostTextNode } from "../nodes/ghost-text-node";

// ============================================================================
// Types
// ============================================================================

export interface CursorPosition {
	nodeKey: string;
	offset: number;
}

export interface MotionResult {
	type: "char" | "line" | "block";
	anchor: CursorPosition;
	head: CursorPosition;
	inclusive: boolean;
}

interface TextPosition {
	node: TextNode;
	offset: number;
	absoluteOffset: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all text nodes in document order
 */
function $getAllTextNodes(): TextNode[] {
	const root = $getRoot();
	const textNodes: TextNode[] = [];

	const collectTextNodes = (node: LexicalNode) => {
		if ($isGhostTextNode(node)) return;
		if ($isTextNode(node)) {
			textNodes.push(node);
			return;
		}
		if ($isElementNode(node)) {
			const children = node.getChildren();
			for (const child of children) {
				collectTextNodes(child);
			}
		}
	};

	collectTextNodes(root);
	return textNodes;
}

/**
 * Get full document text (without ghost nodes)
 */
function $getDocumentText(): string {
	const textNodes = $getAllTextNodes();
	return textNodes.map((n) => n.getTextContent()).join("");
}

/**
 * Convert absolute offset to node + local offset
 */
function $absoluteToPosition(absoluteOffset: number): TextPosition | null {
	const textNodes = $getAllTextNodes();
	let currentOffset = 0;

	for (const node of textNodes) {
		const nodeLength = node.getTextContentSize();
		if (absoluteOffset <= currentOffset + nodeLength) {
			return {
				node,
				offset: absoluteOffset - currentOffset,
				absoluteOffset,
			};
		}
		currentOffset += nodeLength;
	}

	// Return end of document
	const lastNode = textNodes[textNodes.length - 1];
	if (lastNode) {
		return {
			node: lastNode,
			offset: lastNode.getTextContentSize(),
			absoluteOffset: currentOffset,
		};
	}

	return null;
}

/**
 * Convert node + offset to absolute offset
 */
function $positionToAbsolute(nodeKey: string, offset: number): number {
	const textNodes = $getAllTextNodes();
	let absoluteOffset = 0;

	for (const node of textNodes) {
		if (node.getKey() === nodeKey) {
			return absoluteOffset + offset;
		}
		absoluteOffset += node.getTextContentSize();
	}

	return absoluteOffset;
}

/**
 * Get current cursor position
 */
function $getCurrentPosition(): TextPosition | null {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) return null;

	const anchor = selection.anchor;
	const node = anchor.getNode();

	if (!$isTextNode(node) || $isGhostTextNode(node)) return null;

	const absoluteOffset = $positionToAbsolute(node.getKey(), anchor.offset);

	return {
		node,
		offset: anchor.offset,
		absoluteOffset,
	};
}

/**
 * Move cursor to position
 */
function $moveCursorTo(position: TextPosition) {
	const selection = $createRangeSelection();
	selection.anchor.set(position.node.getKey(), position.offset, "text");
	selection.focus.set(position.node.getKey(), position.offset, "text");
	$setSelection(selection);
}

// ============================================================================
// Word Boundary Detection
// ============================================================================

const WORD_CHARS = /[a-zA-Z0-9_]/;
const WORD_BOUNDARY = /[^a-zA-Z0-9_\s]/;

/**
 * Safely get character at index, returns empty string if undefined
 */
function charAt(text: string, index: number): string {
	return text[index] ?? "";
}

function isWordChar(char: string | undefined): boolean {
	if (!char) return false;
	return WORD_CHARS.test(char);
}

function isWhitespace(char: string | undefined): boolean {
	if (!char) return false;
	return /\s/.test(char);
}

function isPunctuation(char: string | undefined): boolean {
	if (!char) return false;
	return WORD_BOUNDARY.test(char);
}

/**
 * Find next word start (w motion)
 */
function findNextWordStart(text: string, offset: number): number {
	let i = offset;

	// Skip current word
	if (i < text.length) {
		if (isWordChar(text[i])) {
			while (i < text.length && isWordChar(text[i])) i++;
		} else if (isPunctuation(text[i])) {
			while (i < text.length && isPunctuation(text[i])) i++;
		}
	}

	// Skip whitespace
	while (i < text.length && isWhitespace(text[i])) i++;

	return Math.min(i, text.length);
}

/**
 * Find next WORD start (W motion)
 */
function findNextWORDStart(text: string, offset: number): number {
	let i = offset;

	// Skip non-whitespace
	while (i < text.length && !isWhitespace(text[i])) i++;

	// Skip whitespace
	while (i < text.length && isWhitespace(text[i])) i++;

	return Math.min(i, text.length);
}

/**
 * Find previous word start (b motion)
 */
function findPrevWordStart(text: string, offset: number): number {
	let i = offset - 1;

	// Skip whitespace
	while (i > 0 && isWhitespace(text[i])) i--;

	// Find start of word
	if (i >= 0) {
		if (isWordChar(text[i])) {
			while (i > 0 && isWordChar(text[i - 1])) i--;
		} else if (isPunctuation(text[i])) {
			while (i > 0 && isPunctuation(text[i - 1])) i--;
		}
	}

	return Math.max(i, 0);
}

/**
 * Find previous WORD start (B motion)
 */
function findPrevWORDStart(text: string, offset: number): number {
	let i = offset - 1;

	// Skip whitespace
	while (i > 0 && isWhitespace(text[i])) i--;

	// Find start of WORD
	while (i > 0 && !isWhitespace(text[i - 1])) i--;

	return Math.max(i, 0);
}

/**
 * Find end of word (e motion)
 */
function findWordEnd(text: string, offset: number): number {
	let i = offset;

	// Move past current position
	if (i < text.length) i++;

	// Skip whitespace
	while (i < text.length && isWhitespace(text[i])) i++;

	// Find end of word
	if (i < text.length) {
		if (isWordChar(text[i])) {
			while (i < text.length - 1 && isWordChar(text[i + 1])) i++;
		} else if (isPunctuation(text[i])) {
			while (i < text.length - 1 && isPunctuation(text[i + 1])) i++;
		}
	}

	return Math.min(i, text.length - 1);
}

/**
 * Find end of WORD (E motion)
 */
function findWORDEnd(text: string, offset: number): number {
	let i = offset;

	// Move past current position
	if (i < text.length) i++;

	// Skip whitespace
	while (i < text.length && isWhitespace(text[i])) i++;

	// Find end of WORD
	while (i < text.length - 1 && !isWhitespace(text[i + 1])) i++;

	return Math.min(i, text.length - 1);
}

// ============================================================================
// Line Operations
// ============================================================================

/**
 * Find start of current line (0 motion)
 */
function findLineStart(text: string, offset: number): number {
	let i = offset;
	while (i > 0 && charAt(text, i - 1) !== "\n") i--;
	return i;
}

/**
 * Find end of current line ($ motion)
 */
function findLineEnd(text: string, offset: number): number {
	let i = offset;
	while (i < text.length && charAt(text, i) !== "\n") i++;
	return i > 0 ? i - 1 : 0;
}

/**
 * Find first non-blank character (^ motion)
 */
function findFirstNonBlank(text: string, offset: number): number {
	const lineStart = findLineStart(text, offset);
	let i = lineStart;
	while (i < text.length && charAt(text, i) !== "\n" && isWhitespace(charAt(text, i))) i++;
	return i;
}

// ============================================================================
// Find Character
// ============================================================================

/**
 * Find character forward (f motion)
 */
function findCharForward(
	text: string,
	offset: number,
	char: string,
	count: number,
): number {
	let found = 0;
	for (let i = offset + 1; i < text.length && charAt(text, i) !== "\n"; i++) {
		if (charAt(text, i) === char) {
			found++;
			if (found === count) return i;
		}
	}
	return offset; // Not found
}

/**
 * Find character backward (F motion)
 */
function findCharBackward(
	text: string,
	offset: number,
	char: string,
	count: number,
): number {
	let found = 0;
	for (let i = offset - 1; i >= 0 && charAt(text, i) !== "\n"; i--) {
		if (charAt(text, i) === char) {
			found++;
			if (found === count) return i;
		}
	}
	return offset; // Not found
}

/**
 * Find character forward, stop before (t motion)
 */
function findTilCharForward(
	text: string,
	offset: number,
	char: string,
	count: number,
): number {
	const pos = findCharForward(text, offset, char, count);
	return pos > offset ? pos - 1 : offset;
}

/**
 * Find character backward, stop after (T motion)
 */
function findTilCharBackward(
	text: string,
	offset: number,
	char: string,
	count: number,
): number {
	const pos = findCharBackward(text, offset, char, count);
	return pos < offset ? pos + 1 : offset;
}

// ============================================================================
// Paragraph/Sentence Navigation
// ============================================================================

/**
 * Find previous paragraph boundary ({ motion)
 */
function findPrevParagraph(text: string, offset: number): number {
	let i = offset - 1;

	// Skip any empty lines at current position
	while (i > 0 && text[i] === "\n") i--;

	// Find next empty line (paragraph boundary)
	while (i > 0) {
		if (text[i] === "\n" && (i === 0 || text[i - 1] === "\n")) {
			return i;
		}
		i--;
	}

	return 0;
}

/**
 * Find next paragraph boundary (} motion)
 */
function findNextParagraph(text: string, offset: number): number {
	let i = offset;

	// Skip current line
	while (i < text.length && text[i] !== "\n") i++;

	// Find next empty line (paragraph boundary)
	while (i < text.length) {
		if (text[i] === "\n" && (i + 1 >= text.length || text[i + 1] === "\n")) {
			return i + 1;
		}
		i++;
	}

	return text.length;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useVimMotions() {
	const [editor] = useLexicalComposerContext();

	/**
	 * Execute a motion and return the result
	 */
	const executeMotion = useCallback(
		(
			motion: string,
			count: number = 1,
			char?: string,
		): MotionResult | null => {
			let result: MotionResult | null = null;

			editor.getEditorState().read(() => {
				const currentPos = $getCurrentPosition();
				if (!currentPos) return;

				const text = $getDocumentText();
				let newOffset = currentPos.absoluteOffset;
				let motionType: "char" | "line" = "char";
				let inclusive = false;

				// Apply motion with count
				for (let i = 0; i < count; i++) {
					switch (motion) {
						// Character motions
						case "h":
							newOffset = Math.max(0, newOffset - 1);
							break;
						case "l":
							newOffset = Math.min(text.length - 1, newOffset + 1);
							break;
						case "j": {
							// Move down one line
							const lineEnd = findLineEnd(text, newOffset);
							const lineStart = findLineStart(text, newOffset);
							const col = newOffset - lineStart;

							if (lineEnd + 1 < text.length) {
								const nextLineStart = lineEnd + 1;
								const nextLineEnd = findLineEnd(text, nextLineStart);
								const nextLineLength = nextLineEnd - nextLineStart;
								newOffset = nextLineStart + Math.min(col, nextLineLength);
							}
							break;
						}
						case "k": {
							// Move up one line
							const lineStart = findLineStart(text, newOffset);
							const col = newOffset - lineStart;

							if (lineStart > 0) {
								const prevLineEnd = lineStart - 1;
								const prevLineStart = findLineStart(text, prevLineEnd);
								const prevLineLength = prevLineEnd - prevLineStart;
								newOffset = prevLineStart + Math.min(col, prevLineLength);
							}
							break;
						}

						// Word motions
						case "w":
							newOffset = findNextWordStart(text, newOffset);
							break;
						case "W":
							newOffset = findNextWORDStart(text, newOffset);
							break;
						case "b":
							newOffset = findPrevWordStart(text, newOffset);
							break;
						case "B":
							newOffset = findPrevWORDStart(text, newOffset);
							break;
						case "e":
							newOffset = findWordEnd(text, newOffset);
							inclusive = true;
							break;
						case "E":
							newOffset = findWORDEnd(text, newOffset);
							inclusive = true;
							break;

						// Line motions
						case "0":
							newOffset = findLineStart(text, newOffset);
							break;
						case "^":
							newOffset = findFirstNonBlank(text, newOffset);
							break;
						case "$":
							newOffset = findLineEnd(text, newOffset);
							inclusive = true;
							break;

						// Find character
						case "f":
							if (char) {
								newOffset = findCharForward(text, newOffset, char, 1);
								inclusive = true;
							}
							break;
						case "F":
							if (char) {
								newOffset = findCharBackward(text, newOffset, char, 1);
							}
							break;
						case "t":
							if (char) {
								newOffset = findTilCharForward(text, newOffset, char, 1);
								inclusive = true;
							}
							break;
						case "T":
							if (char) {
								newOffset = findTilCharBackward(text, newOffset, char, 1);
							}
							break;

						// Paragraph
						case "{":
							newOffset = findPrevParagraph(text, newOffset);
							break;
						case "}":
							newOffset = findNextParagraph(text, newOffset);
							break;

						// File
						case "gg":
							newOffset = 0;
							break;
						case "G":
							if (i === 0 && count > 1) {
								// G with count goes to line number
								// Find the Nth line
								let lineNum = 0;
								let pos = 0;
								while (pos < text.length && lineNum < count - 1) {
									if (text[pos] === "\n") lineNum++;
									pos++;
								}
								newOffset = pos;
								i = count; // Skip remaining iterations
							} else {
								// G without count goes to end
								newOffset = text.length - 1;
							}
							break;

						default:
							return;
					}
				}

				const newPos = $absoluteToPosition(newOffset);
				if (!newPos) return;

				result = {
					type: motionType,
					anchor: {
						nodeKey: currentPos.node.getKey(),
						offset: currentPos.offset,
					},
					head: {
						nodeKey: newPos.node.getKey(),
						offset: newPos.offset,
					},
					inclusive,
				};
			});

			return result;
		},
		[editor],
	);

	/**
	 * Move cursor using a motion
	 */
	const moveCursor = useCallback(
		(motion: string, count: number = 1, char?: string): boolean => {
			const result = executeMotion(motion, count, char);
			if (!result) return false;

			editor.update(() => {
				const newPos = $absoluteToPosition(
					$positionToAbsolute(result.head.nodeKey, result.head.offset),
				);
				if (newPos) {
					$moveCursorTo(newPos);
				}
			});

			return true;
		},
		[editor, executeMotion],
	);

	/**
	 * Extend selection using a motion (for visual mode)
	 */
	const extendSelection = useCallback(
		(motion: string, count: number = 1, char?: string): boolean => {
			const result = executeMotion(motion, count, char);
			if (!result) return false;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const newPos = $absoluteToPosition(
					$positionToAbsolute(result.head.nodeKey, result.head.offset),
				);
				if (newPos) {
					// Keep anchor, move focus
					selection.focus.set(newPos.node.getKey(), newPos.offset, "text");
				}
			});

			return true;
		},
		[editor, executeMotion],
	);

	/**
	 * Get current cursor position info
	 */
	const getCursorPosition = useCallback((): CursorPosition | null => {
		let pos: CursorPosition | null = null;

		editor.getEditorState().read(() => {
			const currentPos = $getCurrentPosition();
			if (currentPos) {
				pos = {
					nodeKey: currentPos.node.getKey(),
					offset: currentPos.offset,
				};
			}
		});

		return pos;
	}, [editor]);

	return {
		executeMotion,
		moveCursor,
		extendSelection,
		getCursorPosition,
	};
}

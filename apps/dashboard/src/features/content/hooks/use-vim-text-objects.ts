import { useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	$isElementNode,
	type LexicalNode,
	type TextNode,
} from "lexical";
import { $isGhostTextNode } from "../nodes/ghost-text-node";
import type { MotionResult } from "./use-vim-motions";

// ============================================================================
// Types
// ============================================================================

export type TextObjectType =
	| "w" // word
	| "W" // WORD
	| "s" // sentence
	| "p" // paragraph
	| '"' // double quotes
	| "'" // single quotes
	| "`" // backticks
	| "(" | ")" | "b" // parentheses
	| "[" | "]" // brackets
	| "{" | "}" | "B" // braces
	| "<" | ">" // angle brackets
	| "t"; // tag

export type TextObjectModifier = "i" | "a"; // inner or around

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
 * Get full document text
 */
function $getDocumentText(): string {
	const textNodes = $getAllTextNodes();
	return textNodes.map((n) => n.getTextContent()).join("");
}

/**
 * Convert node key + offset to absolute offset
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
 * Convert absolute offset to node position
 */
function $absoluteToPosition(
	absoluteOffset: number,
): { nodeKey: string; offset: number } | null {
	const textNodes = $getAllTextNodes();
	let currentOffset = 0;

	for (const node of textNodes) {
		const nodeLength = node.getTextContentSize();
		if (absoluteOffset <= currentOffset + nodeLength) {
			return {
				nodeKey: node.getKey(),
				offset: absoluteOffset - currentOffset,
			};
		}
		currentOffset += nodeLength;
	}

	const lastNode = textNodes[textNodes.length - 1];
	if (lastNode) {
		return {
			nodeKey: lastNode.getKey(),
			offset: lastNode.getTextContentSize(),
		};
	}

	return null;
}

/**
 * Get current cursor position as absolute offset
 */
function $getCurrentAbsoluteOffset(): number {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) return 0;

	const anchor = selection.anchor;
	const node = anchor.getNode();
	if (!$isTextNode(node) || $isGhostTextNode(node)) return 0;

	return $positionToAbsolute(node.getKey(), anchor.offset);
}

// ============================================================================
// Word Detection
// ============================================================================

const WORD_CHARS = /[a-zA-Z0-9_]/;

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

/**
 * Find word boundaries at cursor position
 */
function findWordBounds(
	text: string,
	offset: number,
	inner: boolean,
): { start: number; end: number } | null {
	if (offset >= text.length) return null;

	let start = offset;
	let end = offset;
	const char = charAt(text, offset);

	if (isWordChar(char)) {
		// On a word character
		while (start > 0 && isWordChar(charAt(text, start - 1))) start--;
		while (end < text.length && isWordChar(charAt(text, end))) end++;
	} else if (!isWhitespace(char) && char !== "") {
		// On punctuation
		while (start > 0 && !isWordChar(charAt(text, start - 1)) && !isWhitespace(charAt(text, start - 1))) start--;
		while (end < text.length && !isWordChar(charAt(text, end)) && !isWhitespace(charAt(text, end))) end++;
	} else {
		// On whitespace - find surrounding word
		let foundWord = false;

		// Look forward for word
		let i = offset;
		while (i < text.length && isWhitespace(charAt(text, i))) i++;

		if (i < text.length) {
			start = i;
			end = i;
			if (isWordChar(charAt(text, i))) {
				while (end < text.length && isWordChar(charAt(text, end))) end++;
			} else {
				while (end < text.length && !isWordChar(charAt(text, end)) && !isWhitespace(charAt(text, end))) end++;
			}
			foundWord = true;
		}

		if (!foundWord) return null;
	}

	// For "a word", include trailing whitespace
	if (!inner) {
		while (end < text.length && isWhitespace(charAt(text, end))) end++;
	}

	return { start, end };
}

/**
 * Find WORD boundaries (whitespace-delimited)
 */
function findWORDBounds(
	text: string,
	offset: number,
	inner: boolean,
): { start: number; end: number } | null {
	if (offset >= text.length) return null;

	let start = offset;
	let end = offset;

	if (isWhitespace(charAt(text, offset))) {
		// On whitespace - find next WORD
		while (end < text.length && isWhitespace(charAt(text, end))) end++;
		start = end;
	}

	// Find WORD boundaries
	while (start > 0 && !isWhitespace(charAt(text, start - 1))) start--;
	while (end < text.length && !isWhitespace(charAt(text, end))) end++;

	// For "a WORD", include trailing whitespace
	if (!inner) {
		while (end < text.length && isWhitespace(charAt(text, end))) end++;
	}

	return { start, end };
}

// ============================================================================
// Pair Matching
// ============================================================================

const PAIR_MAP: Record<string, { open: string; close: string }> = {
	'"': { open: '"', close: '"' },
	"'": { open: "'", close: "'" },
	"`": { open: "`", close: "`" },
	"(": { open: "(", close: ")" },
	")": { open: "(", close: ")" },
	"b": { open: "(", close: ")" },
	"[": { open: "[", close: "]" },
	"]": { open: "[", close: "]" },
	"{": { open: "{", close: "}" },
	"}": { open: "{", close: "}" },
	"B": { open: "{", close: "}" },
	"<": { open: "<", close: ">" },
	">": { open: "<", close: ">" },
};

/**
 * Find matching pair boundaries
 */
function findPairBounds(
	text: string,
	offset: number,
	char: string,
	inner: boolean,
): { start: number; end: number } | null {
	const pair = PAIR_MAP[char];
	if (!pair) return null;

	const { open, close } = pair;

	// For quotes (same open/close), use simpler logic
	if (open === close) {
		return findQuoteBounds(text, offset, open, inner);
	}

	// Find opening bracket
	let depth = 0;
	let start = -1;

	// Check if we're on the opening or closing bracket
	if (text[offset] === open) {
		start = offset;
	} else if (text[offset] === close) {
		// Find matching open
		depth = 1;
		for (let i = offset - 1; i >= 0; i--) {
			if (text[i] === close) depth++;
			else if (text[i] === open) {
				depth--;
				if (depth === 0) {
					start = i;
					break;
				}
			}
		}
	} else {
		// Find enclosing pair
		for (let i = offset; i >= 0; i--) {
			if (text[i] === close) depth++;
			else if (text[i] === open) {
				if (depth === 0) {
					start = i;
					break;
				}
				depth--;
			}
		}
	}

	if (start === -1) return null;

	// Find closing bracket
	depth = 1;
	let end = -1;
	for (let i = start + 1; i < text.length; i++) {
		if (text[i] === open) depth++;
		else if (text[i] === close) {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}

	if (end === -1) return null;

	// Inner excludes the brackets
	if (inner) {
		return { start: start + 1, end };
	}
	return { start, end: end + 1 };
}

/**
 * Find quote boundaries (same char for open/close)
 */
function findQuoteBounds(
	text: string,
	offset: number,
	quote: string,
	inner: boolean,
): { start: number; end: number } | null {
	// Find all quote positions in the line
	let lineStart = offset;
	while (lineStart > 0 && charAt(text, lineStart - 1) !== "\n") lineStart--;

	let lineEnd = offset;
	while (lineEnd < text.length && charAt(text, lineEnd) !== "\n") lineEnd++;

	const quotePositions: number[] = [];
	for (let i = lineStart; i < lineEnd; i++) {
		if (charAt(text, i) === quote && (i === 0 || charAt(text, i - 1) !== "\\")) {
			quotePositions.push(i);
		}
	}

	// Find the pair that contains the cursor
	for (let i = 0; i < quotePositions.length - 1; i += 2) {
		const start = quotePositions[i];
		const end = quotePositions[i + 1];

		if (start !== undefined && end !== undefined && offset >= start && offset <= end) {
			if (inner) {
				return { start: start + 1, end };
			}
			return { start, end: end + 1 };
		}
	}

	return null;
}

// ============================================================================
// Sentence and Paragraph
// ============================================================================

/**
 * Find sentence boundaries
 */
function findSentenceBounds(
	text: string,
	offset: number,
	inner: boolean,
): { start: number; end: number } | null {
	// Find sentence start (after previous sentence-ending punctuation)
	let start = offset;
	while (start > 0) {
		const char = charAt(text, start - 1);
		if (char === "." || char === "!" || char === "?") {
			// Check for double space after
			if (start < text.length && isWhitespace(charAt(text, start))) {
				break;
			}
		}
		start--;
	}

	// Skip leading whitespace for inner
	if (inner) {
		while (start < text.length && isWhitespace(charAt(text, start))) start++;
	}

	// Find sentence end
	let end = offset;
	while (end < text.length) {
		const char = charAt(text, end);
		if (char === "." || char === "!" || char === "?") {
			end++;
			break;
		}
		end++;
	}

	// For "a sentence", include trailing whitespace
	if (!inner) {
		while (end < text.length && isWhitespace(charAt(text, end))) end++;
	}

	return { start, end };
}

/**
 * Find paragraph boundaries
 */
function findParagraphBounds(
	text: string,
	offset: number,
	inner: boolean,
): { start: number; end: number } | null {
	// Find paragraph start (after blank line or start of doc)
	let start = offset;
	while (start > 0) {
		if (charAt(text, start - 1) === "\n" && (start < 2 || charAt(text, start - 2) === "\n")) {
			break;
		}
		start--;
	}

	// Find paragraph end (before blank line or end of doc)
	let end = offset;
	while (end < text.length) {
		if (charAt(text, end) === "\n" && (end + 1 >= text.length || charAt(text, end + 1) === "\n")) {
			if (!inner) end++; // Include the newline
			break;
		}
		end++;
	}

	// For "a paragraph", include trailing blank lines
	if (!inner) {
		while (end < text.length && charAt(text, end) === "\n") end++;
	}

	return { start, end };
}

// ============================================================================
// Tag Matching
// ============================================================================

/**
 * Find HTML/XML tag boundaries (basic implementation)
 */
function findTagBounds(
	text: string,
	offset: number,
	inner: boolean,
): { start: number; end: number } | null {
	// Find opening tag
	let tagStart = -1;
	let tagName = "";

	// Look backward for opening tag
	for (let i = offset; i >= 0; i--) {
		if (charAt(text, i) === "<" && i + 1 < text.length && charAt(text, i + 1) !== "/") {
			// Found potential opening tag
			let j = i + 1;
			let name = "";
			while (j < text.length && /[a-zA-Z0-9]/.test(charAt(text, j))) {
				name += charAt(text, j);
				j++;
			}
			if (name) {
				tagStart = i;
				tagName = name;
				break;
			}
		}
	}

	if (tagStart === -1 || !tagName) return null;

	// Find end of opening tag
	let openTagEnd = tagStart;
	while (openTagEnd < text.length && charAt(text, openTagEnd) !== ">") openTagEnd++;
	openTagEnd++; // Include the >

	// Find closing tag
	const closingTag = `</${tagName}>`;
	let depth = 1;
	let closeTagStart = -1;

	for (let i = openTagEnd; i < text.length - closingTag.length + 1; i++) {
		// Check for nested opening tag
		if (text.slice(i, i + tagName.length + 1) === `<${tagName}`) {
			depth++;
		}
		// Check for closing tag
		if (text.slice(i, i + closingTag.length) === closingTag) {
			depth--;
			if (depth === 0) {
				closeTagStart = i;
				break;
			}
		}
	}

	if (closeTagStart === -1) return null;

	if (inner) {
		return { start: openTagEnd, end: closeTagStart };
	}
	return { start: tagStart, end: closeTagStart + closingTag.length };
}

// ============================================================================
// Main Hook
// ============================================================================

export function useVimTextObjects() {
	const [editor] = useLexicalComposerContext();

	/**
	 * Find text object boundaries
	 */
	const findTextObject = useCallback(
		(
			modifier: TextObjectModifier,
			object: TextObjectType,
		): MotionResult | null => {
			let result: MotionResult | null = null;

			editor.getEditorState().read(() => {
				const offset = $getCurrentAbsoluteOffset();
				const text = $getDocumentText();
				const inner = modifier === "i";

				let bounds: { start: number; end: number } | null = null;

				switch (object) {
					case "w":
						bounds = findWordBounds(text, offset, inner);
						break;
					case "W":
						bounds = findWORDBounds(text, offset, inner);
						break;
					case "s":
						bounds = findSentenceBounds(text, offset, inner);
						break;
					case "p":
						bounds = findParagraphBounds(text, offset, inner);
						break;
					case "t":
						bounds = findTagBounds(text, offset, inner);
						break;
					case '"':
					case "'":
					case "`":
					case "(":
					case ")":
					case "b":
					case "[":
					case "]":
					case "{":
					case "}":
					case "B":
					case "<":
					case ">":
						bounds = findPairBounds(text, offset, object, inner);
						break;
				}

				if (!bounds) return;

				const anchorPos = $absoluteToPosition(bounds.start);
				const headPos = $absoluteToPosition(bounds.end);

				if (!anchorPos || !headPos) return;

				result = {
					type: "char",
					anchor: {
						nodeKey: anchorPos.nodeKey,
						offset: anchorPos.offset,
					},
					head: {
						nodeKey: headPos.nodeKey,
						offset: headPos.offset,
					},
					inclusive: false, // Already includes end
				};
			});

			return result;
		},
		[editor],
	);

	return {
		findTextObject,
	};
}

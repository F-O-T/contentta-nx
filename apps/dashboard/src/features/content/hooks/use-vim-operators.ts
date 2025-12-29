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
import {
	setVimMode,
	deleteToRegister,
	yankToRegister,
	getVimState,
} from "../context/vim-context";
import type { MotionResult } from "./use-vim-motions";

// ============================================================================
// Types
// ============================================================================

export type OperatorType = "d" | "c" | "y" | "x" | "X" | "s" | "S" | "r" | "~" | ">" | "<";

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
 * Convert absolute offset to node + local offset
 */
function $absoluteToNodePosition(
	absoluteOffset: number,
): { node: TextNode; offset: number } | null {
	const textNodes = $getAllTextNodes();
	let currentOffset = 0;

	for (const node of textNodes) {
		const nodeLength = node.getTextContentSize();
		if (absoluteOffset <= currentOffset + nodeLength) {
			return {
				node,
				offset: absoluteOffset - currentOffset,
			};
		}
		currentOffset += nodeLength;
	}

	const lastNode = textNodes[textNodes.length - 1];
	if (lastNode) {
		return {
			node: lastNode,
			offset: lastNode.getTextContentSize(),
		};
	}

	return null;
}

/**
 * Get text content between two absolute offsets
 */
function $getTextBetween(startOffset: number, endOffset: number): string {
	const text = $getDocumentText();
	const start = Math.min(startOffset, endOffset);
	const end = Math.max(startOffset, endOffset);
	return text.slice(start, end);
}

/**
 * Delete text between two absolute offsets
 */
function $deleteRange(startOffset: number, endOffset: number): string {
	const textNodes = $getAllTextNodes();
	const start = Math.min(startOffset, endOffset);
	const end = Math.max(startOffset, endOffset);

	let currentOffset = 0;
	let deletedText = "";

	for (const node of textNodes) {
		const nodeLength = node.getTextContentSize();
		const nodeStart = currentOffset;
		const nodeEnd = currentOffset + nodeLength;

		// Check if this node overlaps with deletion range
		if (nodeEnd > start && nodeStart < end) {
			const text = node.getTextContent();
			const deleteStart = Math.max(0, start - nodeStart);
			const deleteEnd = Math.min(nodeLength, end - nodeStart);

			// Track deleted text
			deletedText += text.slice(deleteStart, deleteEnd);

			// Calculate new text
			const newText = text.slice(0, deleteStart) + text.slice(deleteEnd);

			if (newText.length === 0) {
				// Remove the entire node if empty
				node.remove();
			} else {
				// Update node with remaining text
				node.setTextContent(newText);
			}
		}

		currentOffset += nodeLength;
	}

	return deletedText;
}

/**
 * Insert text at absolute offset
 */
function $insertTextAt(offset: number, text: string): void {
	const pos = $absoluteToNodePosition(offset);
	if (!pos) return;

	const { node, offset: localOffset } = pos;

	// Insert text
	const content = node.getTextContent();
	const newContent =
		content.slice(0, localOffset) + text + content.slice(localOffset);
	node.setTextContent(newContent);

	// Position cursor after inserted text
	const selection = $createRangeSelection();
	selection.anchor.set(node.getKey(), localOffset + text.length, "text");
	selection.focus.set(node.getKey(), localOffset + text.length, "text");
	$setSelection(selection);
}

// ============================================================================
// Main Hook
// ============================================================================

export function useVimOperators() {
	const [editor] = useLexicalComposerContext();

	/**
	 * Delete text in a motion range
	 */
	const deleteMotion = useCallback(
		(motion: MotionResult, enterInsertMode = false): boolean => {
			let success = false;

			editor.update(() => {
				const startOffset = $positionToAbsolute(
					motion.anchor.nodeKey,
					motion.anchor.offset,
				);
				let endOffset = $positionToAbsolute(
					motion.head.nodeKey,
					motion.head.offset,
				);

				// Inclusive motions include the character at the end
				if (motion.inclusive) {
					endOffset++;
				}

				// Ensure we have valid range
				if (startOffset === endOffset) return;

				const deletedText = $deleteRange(startOffset, endOffset);

				// Store in register
				const vimState = getVimState();
				deleteToRegister(
					deletedText,
					motion.type === "line" ? "line" : "char",
					vimState.currentRegister,
				);

				// Position cursor
				const cursorOffset = Math.min(startOffset, endOffset);
				const cursorPos = $absoluteToNodePosition(cursorOffset);
				if (cursorPos) {
					const selection = $createRangeSelection();
					selection.anchor.set(cursorPos.node.getKey(), cursorPos.offset, "text");
					selection.focus.set(cursorPos.node.getKey(), cursorPos.offset, "text");
					$setSelection(selection);
				}

				success = true;
			});

			if (success && enterInsertMode) {
				setVimMode("insert");
			}

			return success;
		},
		[editor],
	);

	/**
	 * Yank (copy) text in a motion range
	 */
	const yankMotion = useCallback(
		(motion: MotionResult): boolean => {
			let success = false;

			editor.getEditorState().read(() => {
				const startOffset = $positionToAbsolute(
					motion.anchor.nodeKey,
					motion.anchor.offset,
				);
				let endOffset = $positionToAbsolute(
					motion.head.nodeKey,
					motion.head.offset,
				);

				if (motion.inclusive) {
					endOffset++;
				}

				const text = $getTextBetween(startOffset, endOffset);

				const vimState = getVimState();
				yankToRegister(
					text,
					motion.type === "line" ? "line" : "char",
					vimState.currentRegister,
				);

				success = true;
			});

			return success;
		},
		[editor],
	);

	/**
	 * Delete current character (x command)
	 */
	const deleteChar = useCallback(
		(count: number = 1, before = false): boolean => {
			let success = false;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isGhostTextNode(node)) return;

				const offset = anchor.offset;
				const startOffset = $positionToAbsolute(node.getKey(), offset);

				let deleteStart: number;
				let deleteEnd: number;

				if (before) {
					// X - delete before cursor
					deleteStart = Math.max(0, startOffset - count);
					deleteEnd = startOffset;
				} else {
					// x - delete at cursor
					deleteStart = startOffset;
					deleteEnd = startOffset + count;
				}

				const deletedText = $deleteRange(deleteStart, deleteEnd);

				const vimState = getVimState();
				deleteToRegister(deletedText, "char", vimState.currentRegister);

				// Position cursor
				const cursorPos = $absoluteToNodePosition(deleteStart);
				if (cursorPos) {
					const sel = $createRangeSelection();
					sel.anchor.set(cursorPos.node.getKey(), cursorPos.offset, "text");
					sel.focus.set(cursorPos.node.getKey(), cursorPos.offset, "text");
					$setSelection(sel);
				}

				success = true;
			});

			return success;
		},
		[editor],
	);

	/**
	 * Substitute character (s command) - delete and enter insert mode
	 */
	const substituteChar = useCallback(
		(count: number = 1): boolean => {
			const success = deleteChar(count, false);
			if (success) {
				setVimMode("insert");
			}
			return success;
		},
		[deleteChar],
	);

	/**
	 * Delete entire line (dd command)
	 */
	const deleteLine = useCallback(
		(count: number = 1, enterInsertMode = false): boolean => {
			let success = false;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isGhostTextNode(node)) return;

				const offset = anchor.offset;
				const startOffset = $positionToAbsolute(node.getKey(), offset);

				// Get line boundaries
				const text = $getDocumentText();
				let lineStart = startOffset;
				while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;

				let lineEnd = lineStart;
				for (let i = 0; i < count; i++) {
					while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;
					if (lineEnd < text.length) lineEnd++; // Include newline
				}

				const deletedText = $deleteRange(lineStart, lineEnd);

				const vimState = getVimState();
				deleteToRegister(deletedText, "line", vimState.currentRegister);

				// Position cursor at line start
				const cursorPos = $absoluteToNodePosition(lineStart);
				if (cursorPos) {
					const sel = $createRangeSelection();
					sel.anchor.set(cursorPos.node.getKey(), cursorPos.offset, "text");
					sel.focus.set(cursorPos.node.getKey(), cursorPos.offset, "text");
					$setSelection(sel);
				}

				success = true;
			});

			if (success && enterInsertMode) {
				setVimMode("insert");
			}

			return success;
		},
		[editor],
	);

	/**
	 * Yank entire line (yy command)
	 */
	const yankLine = useCallback(
		(count: number = 1): boolean => {
			let success = false;

			editor.getEditorState().read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isGhostTextNode(node)) return;

				const offset = anchor.offset;
				const startOffset = $positionToAbsolute(node.getKey(), offset);

				const text = $getDocumentText();
				let lineStart = startOffset;
				while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;

				let lineEnd = lineStart;
				for (let i = 0; i < count; i++) {
					while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;
					if (lineEnd < text.length) lineEnd++;
				}

				const yankedText = text.slice(lineStart, lineEnd);

				const vimState = getVimState();
				yankToRegister(yankedText, "line", vimState.currentRegister);

				success = true;
			});

			return success;
		},
		[editor],
	);

	/**
	 * Replace character (r command)
	 */
	const replaceChar = useCallback(
		(char: string, count: number = 1): boolean => {
			let success = false;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isGhostTextNode(node)) return;

				const offset = anchor.offset;
				const text = node.getTextContent();

				// Replace count characters with the specified char
				const endOffset = Math.min(offset + count, text.length);
				const newChar = char.repeat(endOffset - offset);

				const newText = text.slice(0, offset) + newChar + text.slice(endOffset);
				node.setTextContent(newText);

				success = true;
			});

			return success;
		},
		[editor],
	);

	/**
	 * Toggle case (~ command)
	 */
	const toggleCase = useCallback(
		(count: number = 1): boolean => {
			let success = false;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isGhostTextNode(node)) return;

				const offset = anchor.offset;
				const text = node.getTextContent();
				const endOffset = Math.min(offset + count, text.length);

				let toggled = "";
				for (let i = offset; i < endOffset; i++) {
					const char = text[i];
					if (!char) continue;
					if (char === char.toUpperCase()) {
						toggled += char.toLowerCase();
					} else {
						toggled += char.toUpperCase();
					}
				}

				const newText = text.slice(0, offset) + toggled + text.slice(endOffset);
				node.setTextContent(newText);

				// Move cursor forward
				const newSelection = $createRangeSelection();
				newSelection.anchor.set(node.getKey(), endOffset, "text");
				newSelection.focus.set(node.getKey(), endOffset, "text");
				$setSelection(newSelection);

				success = true;
			});

			return success;
		},
		[editor],
	);

	/**
	 * Paste from register
	 */
	const paste = useCallback(
		(after = true): boolean => {
			let success = false;

			editor.update(() => {
				const vimState = getVimState();
				const register = vimState.registers[vimState.currentRegister] ||
					vimState.registers['"'];

				if (!register || !register.content) return;

				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isGhostTextNode(node)) return;

				const offset = anchor.offset;
				const startOffset = $positionToAbsolute(node.getKey(), offset);

				if (register.type === "line") {
					// Line paste: insert on new line
					const text = $getDocumentText();
					let lineEnd = startOffset;
					while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;

					// Include newline if present, otherwise add one
					const insertOffset = after ? lineEnd + 1 : startOffset;
					let content = register.content;
					if (!content.endsWith("\n")) content += "\n";

					$insertTextAt(insertOffset, content);
				} else {
					// Character paste: insert at or after cursor
					const insertOffset = after ? startOffset + 1 : startOffset;
					$insertTextAt(insertOffset, register.content);
				}

				success = true;
			});

			return success;
		},
		[editor],
	);

	/**
	 * Delete to end of line (D command)
	 */
	const deleteToEndOfLine = useCallback((): boolean => {
		let success = false;

		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			const anchor = selection.anchor;
			const node = anchor.getNode();
			if (!$isTextNode(node) || $isGhostTextNode(node)) return;

			const offset = anchor.offset;
			const startOffset = $positionToAbsolute(node.getKey(), offset);

			const text = $getDocumentText();
			let lineEnd = startOffset;
			while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;

			const deletedText = $deleteRange(startOffset, lineEnd);

			const vimState = getVimState();
			deleteToRegister(deletedText, "char", vimState.currentRegister);

			success = true;
		});

		return success;
	}, [editor]);

	/**
	 * Change to end of line (C command)
	 */
	const changeToEndOfLine = useCallback((): boolean => {
		const success = deleteToEndOfLine();
		if (success) {
			setVimMode("insert");
		}
		return success;
	}, [deleteToEndOfLine]);

	/**
	 * Delete visual selection
	 */
	const deleteSelection = useCallback(
		(enterInsertMode = false): boolean => {
			let success = false;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				// Get selection text before deleting
				const selectedText = selection.getTextContent();

				// Delete selection
				selection.removeText();

				const vimState = getVimState();
				deleteToRegister(selectedText, "char", vimState.currentRegister);

				success = true;
			});

			if (success) {
				if (enterInsertMode) {
					setVimMode("insert");
				} else {
					setVimMode("normal");
				}
			}

			return success;
		},
		[editor],
	);

	/**
	 * Yank visual selection
	 */
	const yankSelection = useCallback((): boolean => {
		let success = false;

		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			const selectedText = selection.getTextContent();

			const vimState = getVimState();
			yankToRegister(selectedText, "char", vimState.currentRegister);

			success = true;
		});

		if (success) {
			setVimMode("normal");
		}

		return success;
	}, [editor]);

	return {
		deleteMotion,
		yankMotion,
		deleteChar,
		substituteChar,
		deleteLine,
		yankLine,
		replaceChar,
		toggleCase,
		paste,
		deleteToEndOfLine,
		changeToEndOfLine,
		deleteSelection,
		yankSelection,
	};
}

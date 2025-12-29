"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	$createTextNode,
	$getNodeByKey,
	COMMAND_PRIORITY_HIGH,
	KEY_ESCAPE_COMMAND,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_LOW,
	type LexicalNode,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditCompletion } from "../hooks/use-edit-completion";
import { EditPromptPanel } from "../ui/edit-prompt-panel";
import { EditSelectionHint } from "../ui/edit-selection-hint";
import {
	useEditContext,
	openEditPrompt,
	startEditStreaming,
	appendEditStreamedText,
	setEditPlaceholderNodeKey,
	completeEdit,
	cancelEdit,
	clearEdit,
} from "../context/edit-context";
import { $isGhostTextNode } from "../nodes/ghost-text-node";

interface EditPluginProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Edit Plugin for Ctrl+K agentic text editing.
 *
 * Flow:
 * 1. User selects text and presses Ctrl+K
 * 2. Floating prompt appears for edit instruction
 * 3. User enters instruction and presses Enter
 * 4. Selected text is replaced with streaming AI response
 *
 * Controls:
 * - Ctrl+K: Open edit prompt (with selection)
 * - Enter: Submit instruction
 * - Escape: Cancel/dismiss
 */
export function EditPlugin({ containerRef }: EditPluginProps) {
	const [editor] = useLexicalComposerContext();
	const { phase, position, selectedText, placeholderNodeKey } =
		useEditContext();

	// Track selection for showing hint
	const [selectionHint, setSelectionHint] = useState<{
		hasSelection: boolean;
		position: { top: number; left: number } | null;
	}>({ hasSelection: false, position: null });

	// originalSelection is stored in context but not used directly here
	// It's available for potential undo/restore functionality

	const isFirstChunkRef = useRef(true);
	const fullTextRef = useRef("");

	// Calculate position relative to container
	const getSelectionPosition = useCallback(() => {
		const container = containerRef.current;
		if (!container) return null;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return null;

		const range = selection.getRangeAt(0);
		const containerRect = container.getBoundingClientRect();
		const rangeRect = range.getBoundingClientRect();

		return {
			top: rangeRect.top - containerRect.top,
			left: rangeRect.left - containerRect.left,
		};
	}, [containerRef]);

	// Get full document text for context
	const getDocumentContext = useCallback(() => {
		let fullText = "";
		let selectionStart = 0;
		let selectionEnd = 0;

		editor.getEditorState().read(() => {
			const root = $getRoot();
			const selection = $getSelection();

			// Get all text content
			const getTextWithoutGhost = (node: LexicalNode): string => {
				if ($isGhostTextNode(node)) return "";
				if ($isTextNode(node)) return node.getTextContent();
				if ("getChildren" in node) {
					const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
					return children.map(getTextWithoutGhost).join("");
				}
				return "";
			};
			fullText = getTextWithoutGhost(root);

			// Calculate selection offsets
			if ($isRangeSelection(selection)) {
				let currentOffset = 0;
				let foundStart = false;
				let foundEnd = false;

				const walkNode = (node: LexicalNode) => {
					if (foundStart && foundEnd) return;
					if ($isGhostTextNode(node)) return;

					if ($isTextNode(node)) {
						const nodeKey = node.getKey();
						const textLength = node.getTextContentSize();

						if (nodeKey === selection.anchor.key && !foundStart) {
							selectionStart = currentOffset + selection.anchor.offset;
							foundStart = true;
						}
						if (nodeKey === selection.focus.key && !foundEnd) {
							selectionEnd = currentOffset + selection.focus.offset;
							foundEnd = true;
						}

						currentOffset += textLength;
					}

					if ("getChildren" in node) {
						const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
						for (const child of children) {
							walkNode(child);
						}
					}
				};

				walkNode(root);

				// Ensure start < end
				if (selectionStart > selectionEnd) {
					[selectionStart, selectionEnd] = [selectionEnd, selectionStart];
				}
			}
		});

		return {
			fullText,
			contextBefore: fullText.slice(0, selectionStart),
			contextAfter: fullText.slice(selectionEnd),
		};
	}, [editor]);

	// Handle streaming chunk
	const handleChunk = useCallback(
		(chunk: string) => {
			appendEditStreamedText(chunk);
			fullTextRef.current += chunk;

			editor.update(
				() => {
					if (isFirstChunkRef.current) {
						// First chunk: delete selection and insert placeholder
						isFirstChunkRef.current = false;

						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							// Delete the selected text
							selection.removeText();

							// Insert placeholder text node with streaming content
							const placeholderNode = $createTextNode(chunk);
							// Apply a subtle style to indicate streaming
							placeholderNode.setStyle("color: var(--muted-foreground)");
							selection.insertNodes([placeholderNode]);

							// Store the node key for subsequent updates
							setEditPlaceholderNodeKey(placeholderNode.getKey());
						}
					} else {
						// Subsequent chunks: append to placeholder node
						const nodeKey = placeholderNodeKey;
						if (nodeKey) {
							const node = $getNodeByKey(nodeKey);
							if ($isTextNode(node)) {
								const currentText = node.getTextContent();
								node.setTextContent(currentText + chunk);
							}
						}
					}
				},
				{ tag: "edit-streaming" },
			);
		},
		[editor, placeholderNodeKey],
	);

	// Handle streaming complete
	const handleComplete = useCallback(
		(_fullText: string) => {
			// Remove the muted styling from the placeholder
			editor.update(
				() => {
					const nodeKey = placeholderNodeKey;
					if (nodeKey) {
						const node = $getNodeByKey(nodeKey);
						if ($isTextNode(node)) {
							// Remove the muted color styling
							node.setStyle("");
							// Position cursor at end of inserted text
							const textLength = node.getTextContentSize();
							node.select(textLength, textLength);
						}
					}
				},
				{ tag: "edit-streaming" },
			);

			completeEdit();

			// Clear state after a short delay
			setTimeout(() => {
				clearEdit();
			}, 100);
		},
		[editor, placeholderNodeKey],
	);

	// Handle error
	const handleError = useCallback((error: Error) => {
		console.error("Edit error:", error);
		// Keep partial result if any
		clearEdit();
	}, []);

	const { requestEdit, cancelEdit: cancelEditRequest } = useEditCompletion({
		onChunk: handleChunk,
		onComplete: handleComplete,
		onError: handleError,
	});

	// Handle submit instruction
	const handleSubmit = useCallback(
		(instruction: string) => {
			if (!selectedText) return;

			// Reset streaming state
			isFirstChunkRef.current = true;
			fullTextRef.current = "";

			startEditStreaming();

			// Get context for the edit
			const { contextBefore, contextAfter } = getDocumentContext();

			// Request the edit
			requestEdit({
				selectedText,
				instruction,
				contextBefore: contextBefore.slice(-500), // Limit context size
				contextAfter: contextAfter.slice(0, 200),
				maxTokens: 512,
				temperature: 0.3,
			});
		},
		[selectedText, getDocumentContext, requestEdit],
	);

	// Handle cancel
	const handleCancel = useCallback(() => {
		cancelEditRequest();
		cancelEdit();
	}, [cancelEditRequest]);

	// Ctrl+K handler
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === "k") {
				e.preventDefault();

				// Don't open if already in edit mode
				if (phase !== "idle") return;

				editor.getEditorState().read(() => {
					const selection = $getSelection();

					// Only proceed if there's a text selection (not collapsed)
					if (!$isRangeSelection(selection) || selection.isCollapsed()) {
						return;
					}

					const selectedText = selection.getTextContent();

					// Don't proceed if selection is too short
					if (selectedText.trim().length < 1) {
						return;
					}

					// Check selection length limit
					if (selectedText.length > 4000) {
						console.warn("Selection too long for edit");
						return;
					}

					const pos = getSelectionPosition();
					if (!pos) return;

					// Capture selection state
					const originalSelection = {
						anchorKey: selection.anchor.key,
						anchorOffset: selection.anchor.offset,
						focusKey: selection.focus.key,
						focusOffset: selection.focus.offset,
					};

					openEditPrompt({
						selectedText,
						position: pos,
						originalSelection,
					});
				});
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [editor, phase, getSelectionPosition]);

	// Escape handler
	useEffect(() => {
		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			() => {
				if (phase !== "idle") {
					handleCancel();
					return true;
				}
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, phase, handleCancel]);

	// Update listener to cancel edit if user types during prompting
	useEffect(() => {
		return editor.registerUpdateListener(({ tags, dirtyElements }) => {
			// Skip our own updates
			if (tags.has("edit-streaming")) return;
			if (tags.has("history-merge")) return;

			// If user is typing while in prompting phase, cancel
			if (phase === "prompting" && dirtyElements.size > 0) {
				handleCancel();
			}
		});
	}, [editor, phase, handleCancel]);

	// Selection change listener to show/hide hint
	useEffect(() => {
		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				// Don't show hint if we're in edit mode
				if (phase !== "idle") {
					setSelectionHint({ hasSelection: false, position: null });
					return false;
				}

				editor.getEditorState().read(() => {
					const selection = $getSelection();

					if ($isRangeSelection(selection) && !selection.isCollapsed()) {
						const text = selection.getTextContent();
						// Only show hint for meaningful selections
						if (text.trim().length >= 3) {
							const pos = getSelectionPosition();
							if (pos) {
								setSelectionHint({ hasSelection: true, position: pos });
								return;
							}
						}
					}

					setSelectionHint({ hasSelection: false, position: null });
				});

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, phase, getSelectionPosition]);

	// Render the prompt panel when in prompting or streaming phase
	if ((phase === "prompting" || phase === "streaming") && position) {
		return (
			<EditPromptPanel
				position={position}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
				isStreaming={phase === "streaming"}
				containerRef={containerRef}
			/>
		);
	}

	// Show selection hint when text is selected in idle phase
	if (phase === "idle" && selectionHint.hasSelection && selectionHint.position) {
		return (
			<EditSelectionHint
				position={selectionHint.position}
				isVisible={true}
			/>
		);
	}

	return null;
}

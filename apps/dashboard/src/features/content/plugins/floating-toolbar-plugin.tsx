"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	FORMAT_TEXT_COMMAND,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_LOW,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useCallback, useEffect, useState } from "react";
import {
	FloatingTextFormatToolbar,
	type TextFormatType,
} from "../ui/floating-text-format-toolbar";
import { openEditPrompt, useEditContext } from "../context/edit-context";

interface FloatingToolbarPluginProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Plugin that displays a floating toolbar when text is selected.
 * Provides quick access to text formatting options like bold, italic, etc.
 */
export function FloatingToolbarPlugin({
	containerRef,
}: FloatingToolbarPluginProps) {
	const [editor] = useLexicalComposerContext();
	const { phase } = useEditContext();

	const [toolbarState, setToolbarState] = useState<{
		isVisible: boolean;
		position: { top: number; left: number } | null;
		activeFormats: Set<TextFormatType>;
		isLink: boolean;
	}>({
		isVisible: false,
		position: null,
		activeFormats: new Set(),
		isLink: false,
	});

	// Calculate position relative to container, centered on selection
	const getSelectionPosition = useCallback(() => {
		const container = containerRef.current;
		if (!container) return null;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed)
			return null;

		const range = selection.getRangeAt(0);
		const containerRect = container.getBoundingClientRect();
		const rangeRect = range.getBoundingClientRect();

		// Position at center-top of the selection
		return {
			top: rangeRect.top - containerRect.top,
			left: rangeRect.left - containerRect.left + rangeRect.width / 2,
		};
	}, [containerRef]);

	// Update toolbar state based on selection
	const updateToolbar = useCallback(() => {
		editor.getEditorState().read(() => {
			const selection = $getSelection();

			if (!$isRangeSelection(selection) || selection.isCollapsed()) {
				setToolbarState((prev) => ({
					...prev,
					isVisible: false,
					position: null,
				}));
				return;
			}

			const text = selection.getTextContent();
			// Only show for meaningful selections (at least 1 character)
			if (text.trim().length < 1) {
				setToolbarState((prev) => ({
					...prev,
					isVisible: false,
					position: null,
				}));
				return;
			}

			// Get active formats
			const activeFormats = new Set<TextFormatType>();
			if (selection.hasFormat("bold")) activeFormats.add("bold");
			if (selection.hasFormat("italic")) activeFormats.add("italic");
			if (selection.hasFormat("strikethrough"))
				activeFormats.add("strikethrough");
			if (selection.hasFormat("underline")) activeFormats.add("underline");
			if (selection.hasFormat("code")) activeFormats.add("code");

			// Check if selection contains a link
			const nodes = selection.getNodes();
			let isLink = false;
			for (const node of nodes) {
				const parent = node.getParent();
				if ($isLinkNode(parent) || $isLinkNode(node)) {
					isLink = true;
					break;
				}
			}

			const position = getSelectionPosition();
			if (position) {
				setToolbarState({
					isVisible: true,
					position,
					activeFormats,
					isLink,
				});
			}
		});
	}, [editor, getSelectionPosition]);

	// Listen for selection changes
	useEffect(() => {
		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateToolbar();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, updateToolbar]);

	// Also update on editor updates (for format changes)
	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar();
			});
		});
	}, [editor, updateToolbar]);

	// Hide toolbar when clicking outside or on mouse down in editor
	useEffect(() => {
		const handleMouseDown = (e: MouseEvent) => {
			// Check if clicking inside the toolbar
			const target = e.target as HTMLElement;
			if (target.closest("[data-floating-toolbar]")) {
				return;
			}
		};

		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, []);

	// Format text handler
	const handleFormat = useCallback(
		(format: TextFormatType) => {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
		},
		[editor],
	);

	// Toggle link handler
	const handleToggleLink = useCallback(() => {
		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			// Check if already a link
			const nodes = selection.getNodes();
			let hasLink = false;
			for (const node of nodes) {
				const parent = node.getParent();
				if ($isLinkNode(parent) || $isLinkNode(node)) {
					hasLink = true;
					break;
				}
			}

			if (hasLink) {
				// Remove link
				editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
			} else {
				// Prompt for URL
				const url = prompt("Enter URL:");
				if (url) {
					editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
				}
			}
		});
	}, [editor]);

	// AI Edit handler - opens the edit prompt
	const handleAIEdit = useCallback(() => {
		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection) || selection.isCollapsed()) return;

			const selectedText = selection.getTextContent();
			if (selectedText.trim().length < 1) return;

			// Check selection length limit
			if (selectedText.length > 4000) {
				console.warn("Selection too long for edit");
				return;
			}

			const position = getSelectionPosition();
			if (!position) return;

			// Capture selection state
			const originalSelection = {
				anchorKey: selection.anchor.key,
				anchorOffset: selection.anchor.offset,
				focusKey: selection.focus.key,
				focusOffset: selection.focus.offset,
			};

			openEditPrompt({
				selectedText,
				position,
				originalSelection,
			});
		});
	}, [editor, getSelectionPosition]);

	if (!toolbarState.isVisible || !toolbarState.position || phase !== "idle") {
		return null;
	}

	return (
		<div data-floating-toolbar>
			<FloatingTextFormatToolbar
				position={toolbarState.position}
				isVisible={toolbarState.isVisible}
				activeFormats={toolbarState.activeFormats}
				isLink={toolbarState.isLink}
				onFormat={handleFormat}
				onToggleLink={handleToggleLink}
				onAIEdit={handleAIEdit}
				containerRef={containerRef}
			/>
		</div>
	);
}

"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	$createTextNode,
	COMMAND_PRIORITY_HIGH,
	KEY_ESCAPE_COMMAND,
	KEY_TAB_COMMAND,
	type LexicalNode,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { useFIMCompletion } from "../hooks/use-fim-completion";
import { detectFIMMode } from "../hooks/use-fim-mode";
import { buildFIMContext } from "@packages/fim/client";
import { FIMStatusLine } from "../ui/fim-status-line";
import { FIMFloatingPanel } from "../ui/fim-floating-panel";
import {
	$createGhostTextNode,
	$isGhostTextNode,
	GhostTextNode,
} from "../nodes/ghost-text-node";
import {
	useFIMContext,
	clearFIM,
	setFIMMode,
	startFIMSession,
	completeFIMSession,
	appendGhostText,
	setFIMPosition,
	type FIMMode,
} from "../context/fim-context";

const DEBOUNCE_MS = 500;

interface FIMPluginProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Unified FIM Plugin supporting both Copilot and Cursor Tab modes.
 *
 * Copilot Mode: Inline ghost text using GhostTextNode
 * Cursor Tab Mode: Floating panel for multi-line suggestions
 *
 * Trigger:
 * - Auto: After 500ms of typing pause
 * - Manual: Ctrl+Space for Cursor Tab mode
 *
 * Accept: Tab key
 * Dismiss: Escape key or new typing
 */
export function FIMPlugin({ containerRef }: FIMPluginProps) {
	const [editor] = useLexicalComposerContext();
	const { mode, ghostText, isVisible, isLoading, position } = useFIMContext();

	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastTextRef = useRef<string>("");
	const isManualTriggerRef = useRef(false);
	const completionIdRef = useRef<string | null>(null);
	// Use ref to track current mode for streaming callbacks (avoids stale closure)
	const currentModeRef = useRef<FIMMode>("idle");
	// Flag to skip update listener right after completion (to avoid clearing from getRelativePosition DOM changes)
	const justCompletedRef = useRef(false);

	// Calculate position relative to container
	const getRelativePosition = useCallback(() => {
		const container = containerRef.current;
		if (!container) return null;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return null;

		const range = selection.getRangeAt(0);
		const containerRect = container.getBoundingClientRect();

		// For collapsed selection, create a temp span to get position
		if (range.collapsed) {
			const span = document.createElement("span");
			span.textContent = "\u200B"; // Zero-width space
			range.insertNode(span);
			const rangeRect = span.getBoundingClientRect();
			span.parentNode?.removeChild(span);

			// Restore selection
			selection.removeAllRanges();
			selection.addRange(range);

			const left = rangeRect.left - containerRect.left;
			return {
				top: rangeRect.top - containerRect.top,
				left,
				maxWidth: containerRect.width - left - 16,
			};
		}

		const rangeRect = range.getBoundingClientRect();
		const left = rangeRect.right - containerRect.left;

		return {
			top: rangeRect.top - containerRect.top,
			left,
			maxWidth: containerRect.width - left - 16,
		};
	}, [containerRef]);

	// Clear ghost text node from editor
	const $clearGhostTextNodes = useCallback(() => {
		const root = $getRoot();

		const findAndRemoveGhostNodes = (node: LexicalNode) => {
			if ($isGhostTextNode(node)) {
				node.remove();
				return;
			}

			if ("getChildren" in node) {
				const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
				for (const child of children) {
					findAndRemoveGhostNodes(child);
				}
			}
		};

		findAndRemoveGhostNodes(root);
	}, []);

	// Accept ghost text - convert to real text
	const $acceptGhostText = useCallback(() => {
		const root = $getRoot();
		let accepted = false;
		console.log("[FIM] $acceptGhostText - searching for ghost nodes");

		const findAndAcceptGhostNodes = (node: LexicalNode) => {
			console.log("[FIM] Checking node:", node.getType());
			if ($isGhostTextNode(node)) {
				console.log("[FIM] Found ghost node:", node.getTextContent().slice(0, 30));
				const textContent = node.getTextContent();
				const parent = node.getParent();
				console.log("[FIM] Parent:", parent?.getType());

				if (parent) {
					const textNode = $createTextNode(textContent);
					// Insert text node before ghost, then remove ghost
					// (using insertBefore + remove instead of replace for token-mode compatibility)
					node.insertBefore(textNode);
					node.remove();
					// Position cursor at end of inserted text
					const textLength = textNode.getTextContentSize();
					textNode.select(textLength, textLength);
					accepted = true;
					console.log("[FIM] Ghost node accepted successfully");
				}
				return;
			}

			if ("getChildren" in node) {
				const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
				for (const child of children) {
					findAndAcceptGhostNodes(child);
				}
			}
		};

		findAndAcceptGhostNodes(root);
		console.log("[FIM] $acceptGhostText returning:", accepted);
		return accepted;
	}, []);

	// Handle clearing all FIM state
	const handleClearFIM = useCallback(() => {
		editor.update(() => {
			$clearGhostTextNodes();
		});
		clearFIM();
		completionIdRef.current = null;
		isManualTriggerRef.current = false;
		currentModeRef.current = "idle";
	}, [editor, $clearGhostTextNodes]);

	// Handle accepting the suggestion
	const handleAcceptSuggestion = useCallback(() => {
		console.log("[FIM] handleAcceptSuggestion called", { isVisible, ghostText: ghostText?.slice(0, 30) });
		if (!isVisible || !ghostText) {
			console.log("[FIM] Early return - isVisible:", isVisible, "ghostText:", !!ghostText);
			return false;
		}

		// First, try to accept inline ghost nodes
		let accepted = false;
		editor.update(() => {
			console.log("[FIM] Running $acceptGhostText");
			accepted = $acceptGhostText();
			console.log("[FIM] $acceptGhostText returned:", accepted);
		});

		// If no ghost nodes found, insert from state at cursor (fallback)
		if (!accepted && ghostText) {
			console.log("[FIM] Trying fallback insertion");
			editor.update(() => {
				const selection = $getSelection();
				console.log("[FIM] Selection type:", selection?.constructor.name, "$isRangeSelection:", $isRangeSelection(selection));
				if ($isRangeSelection(selection)) {
					const textNode = $createTextNode(ghostText);
					selection.insertNodes([textNode]);
					accepted = true;
					console.log("[FIM] Fallback insertion successful");
				}
			});
		}

		console.log("[FIM] Final accepted:", accepted);
		if (accepted) {
			clearFIM();
			completionIdRef.current = null;
			currentModeRef.current = "idle";
			return true;
		}

		return false;
	}, [editor, ghostText, isVisible, $acceptGhostText]);

	// Stable callbacks for useFIMCompletion
	const handleChunk = useCallback(
		(chunk: string) => {
			appendGhostText(chunk);

			// For copilot mode, update the ghost text node in the editor
			// Use ref to avoid stale closure - always insert during streaming for non-manual triggers
			const shouldInsertInline = currentModeRef.current === "copilot" || !isManualTriggerRef.current;
			
			if (shouldInsertInline) {
				// Use tag to prevent update listener from clearing the ghost text
				editor.update(() => {
					const currentId = completionIdRef.current;
					if (!currentId) return;

					// Find existing ghost node and update it, or insert new one
					const root = $getRoot();
					let foundGhost = false;

					const findGhostNode = (node: LexicalNode): GhostTextNode | null => {
						if ($isGhostTextNode(node) && node.getUUID() === currentId) {
							return node;
						}
						if ("getChildren" in node) {
							const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
							for (const child of children) {
								const found = findGhostNode(child);
								if (found) return found;
							}
						}
						return null;
					};

					const existingGhost = findGhostNode(root);

					if (existingGhost) {
						// Update existing ghost node with new text
						const newText = existingGhost.getTextContent() + chunk;
						const newGhost = $createGhostTextNode(newText, currentId);
						existingGhost.replace(newGhost as LexicalNode);
						newGhost.selectPrevious();
						foundGhost = true;
					}

					// If no ghost node exists yet, insert one
					if (!foundGhost) {
						const selection = $getSelection();
						if ($isRangeSelection(selection) && selection.isCollapsed()) {
							const ghostNode = $createGhostTextNode(chunk, currentId);
							selection.insertNodes([ghostNode as LexicalNode]);
							ghostNode.selectPrevious();
						}
					}
				}, { tag: "fim-ghost-insert" });
			}
		},
		[editor],
	);

	const handleComplete = useCallback(
		(fullText: string) => {
			console.log("[FIM] handleComplete called, fullText length:", fullText.length);
			
			// Set flag to prevent update listener from clearing FIM during position calculation
			justCompletedRef.current = true;
			
			completeFIMSession();

			// Detect mode based on completion content
			const detectedMode = detectFIMMode(fullText, {
				isManualTrigger: isManualTriggerRef.current,
			});

			console.log("[FIM] Detected mode:", detectedMode.mode, "reason:", detectedMode.reason);
			currentModeRef.current = detectedMode.mode; // Update ref
			setFIMMode(detectedMode.mode);

			// Set position for floating panel (for cursor-tab mode)
			// Note: getRelativePosition modifies DOM which can trigger updates
			if (detectedMode.mode === "cursor-tab") {
				console.log("[FIM] Getting relative position for cursor-tab mode");
				const pos = getRelativePosition();
				if (pos) {
					setFIMPosition(pos);
				}
			}
			
			// Clear flag after a short delay to allow DOM updates to settle
			setTimeout(() => {
				justCompletedRef.current = false;
			}, 50);
			// Note: Do NOT clear ghost nodes here - let Tab or Escape handle it
		},
		[getRelativePosition],
	);

	const handleError = useCallback(
		(error: Error) => {
			console.error("FIM error:", error);
			handleClearFIM();
		},
		[handleClearFIM],
	);

	const { requestCompletion, cancelCompletion } = useFIMCompletion({
		onChunk: handleChunk,
		onComplete: handleComplete,
		onError: handleError,
	});

	// Get cursor offset in document
	const getCursorOffset = useCallback((): number => {
		let offset = 0;

		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			const anchor = selection.anchor;
			const anchorNode = anchor.getNode();
			const anchorOffset = anchor.offset;

			// Walk through all text nodes to calculate true offset
			let currentOffset = 0;
			const walkNode = (node: LexicalNode): boolean => {
				if ($isGhostTextNode(node)) {
					// Skip ghost text nodes in offset calculation
					return false;
				}
				if ($isTextNode(node)) {
					if (node.is(anchorNode)) {
						offset = currentOffset + anchorOffset;
						return true;
					}
					currentOffset += node.getTextContentSize();
				}
				if ("getChildren" in node) {
					const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
					for (const child of children) {
						if (walkNode(child)) return true;
					}
				}
				return false;
			};

			const root = $getRoot();
			walkNode(root);
		});

		return offset;
	}, [editor]);

	// Trigger completion request
	const triggerCompletion = useCallback(
		(options: { isManualTrigger?: boolean } = {}) => {
			isManualTriggerRef.current = options.isManualTrigger ?? false;

			// Generate new completion ID
			const newCompletionId = crypto.randomUUID();
			completionIdRef.current = newCompletionId;

			// Start FIM session
			startFIMSession(newCompletionId);

			// Set initial mode based on trigger type
			const initialMode = options.isManualTrigger ? "cursor-tab" : "copilot";
			currentModeRef.current = initialMode; // Update ref immediately for streaming callbacks
			setFIMMode(initialMode);

			editor.getEditorState().read(() => {
				const root = $getRoot();

				// Get text content excluding ghost text nodes
				let textContent = "";
				const getTextWithoutGhost = (node: LexicalNode) => {
					if ($isGhostTextNode(node)) return;
					if ($isTextNode(node)) {
						textContent += node.getTextContent();
						return;
					}
					if ("getChildren" in node) {
						const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
						for (const child of children) {
							getTextWithoutGhost(child);
						}
					}
				};
				getTextWithoutGhost(root);

				// Don't trigger if no content
				if (!textContent.trim()) {
					clearFIM();
					return;
				}

				// Don't trigger if content hasn't changed (unless manual)
				if (!options.isManualTrigger && textContent === lastTextRef.current) {
					clearFIM();
					return;
				}
				lastTextRef.current = textContent;

				const cursorOffset = getCursorOffset();

				// Build context for FIM
				const { prefix, suffix } = buildFIMContext(textContent, cursorOffset);

				// Don't trigger if prefix is too short
				if (prefix.length < 10) {
					clearFIM();
					return;
				}

				// Context detection is available for future use
				// const context = detectCompletionContext(prefix);

				requestCompletion({
					prefix,
					suffix,
					contextType: "document",
					maxTokens: options.isManualTrigger ? 128 : 64,
					temperature: 0.3,
					stopSequences: options.isManualTrigger
						? ["\n\n\n"]
						: ["\n\n", ".", "!", "?"],
				});
			});
		},
		[editor, requestCompletion, getCursorOffset],
	);

	// Handle text changes with debounce
	useEffect(() => {
		return editor.registerUpdateListener(({ tags, dirtyElements }) => {
			console.log("[FIM] Update listener fired", {
				tags: Array.from(tags),
				dirtyCount: dirtyElements.size,
				isVisible,
				justCompleted: justCompletedRef.current,
			});

			// Skip history merges
			if (tags.has("history-merge")) return;

			// Skip FIM ghost text insertions
			if (tags.has("fim-ghost-insert")) {
				console.log("[FIM] Skipping update - fim-ghost-insert tag");
				return;
			}

			// Skip updates right after completion (from getRelativePosition DOM changes)
			if (justCompletedRef.current) {
				console.log("[FIM] Skipping update - just completed");
				return;
			}

			// Only react to actual content changes
			if (dirtyElements.size > 0) {
				// Clear any existing debounce timer
				if (debounceTimerRef.current) {
					clearTimeout(debounceTimerRef.current);
				}

				// Clear existing suggestion when user types
				if (isVisible) {
					console.log("[FIM] Clearing FIM - user typed, tags:", Array.from(tags));
					handleClearFIM();
				}

				// Debounce the completion request
				debounceTimerRef.current = setTimeout(() => {
					triggerCompletion();
				}, DEBOUNCE_MS);
			}
		});
	}, [editor, triggerCompletion, isVisible, handleClearFIM]);

	// Tab to accept ghost text
	useEffect(() => {
		return editor.registerCommand(
			KEY_TAB_COMMAND,
			(event) => {
				console.log("[FIM] Tab pressed", { isVisible, ghostText: ghostText?.slice(0, 30) });
				if (isVisible && ghostText) {
					event.preventDefault();
					const result = handleAcceptSuggestion();
					console.log("[FIM] Tab handler result:", result);
					return result;
				}
				console.log("[FIM] Tab not handled - conditions not met");
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, isVisible, ghostText, handleAcceptSuggestion]);

	// Escape to dismiss ghost text
	useEffect(() => {
		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			() => {
				if (isVisible) {
					handleClearFIM();
					return true;
				}
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, isVisible, handleClearFIM]);

	// Ctrl+Space to manually trigger cursor-tab mode
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.code === "Space") {
				e.preventDefault();
				handleClearFIM(); // Clear any existing suggestion
				triggerCompletion({ isManualTrigger: true });
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [triggerCompletion, handleClearFIM]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
			cancelCompletion();
			clearFIM();
		};
	}, [cancelCompletion]);

	const hasSuggestion = isVisible && !!ghostText;

	return (
		<>
			{/* Floating panel for cursor-tab mode */}
			{mode === "cursor-tab" && position && (
				<FIMFloatingPanel
					suggestion={ghostText}
					position={position}
					isVisible={isVisible && !isLoading}
					containerRef={containerRef}
				/>
			)}

			{/* Status line at bottom of editor */}
			<FIMStatusLine
				isLoading={isLoading}
				hasSuggestion={hasSuggestion}
				mode={mode}
			/>
		</>
	);
}

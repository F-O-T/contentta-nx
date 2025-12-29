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
import { useFIMTriggers, type TriggerContext } from "../hooks/use-fim-triggers";
import { detectFIMMode } from "../hooks/use-fim-mode";
import { detectDiffType } from "../hooks/use-fim-diff";
import { buildFIMContext } from "@packages/fim/client";
import type { FIMTriggerType, FIMChunkMetadata } from "@packages/fim";
import { FIMStatusLine } from "../ui/fim-status-line";
import { FIMFloatingPanel } from "../ui/fim-floating-panel";
import { FIMDiffPanel } from "../ui/fim-diff-panel";
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
	setConfidence,
	setFIMMetrics,
	setDiffSuggestion,
	incrementChainDepth,
	resetChain,
	type FIMMode,
} from "../context/fim-context";

// Max chain depth to prevent infinite loops
const MAX_CHAIN_DEPTH = 5;

interface FIMPluginProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Unified FIM Plugin supporting Copilot, Cursor Tab, and Diff modes.
 *
 * Copilot Mode: Inline ghost text using GhostTextNode
 * Cursor Tab Mode: Floating panel for multi-line suggestions
 * Diff Mode: Side-by-side replacement preview
 *
 * Triggers:
 * - Auto: After 500ms of typing pause (debounce)
 * - Cursor move: On selection change
 * - Punctuation: After . ! ?
 * - Newline: After Enter key
 * - Chain: After accepting a suggestion
 * - Manual: Ctrl+Space for Cursor Tab mode
 *
 * Accept: Tab key
 * Dismiss: Escape key or new typing
 */
export function FIMPlugin({ containerRef }: FIMPluginProps) {
	const [editor] = useLexicalComposerContext();
	const {
		mode,
		ghostText,
		isVisible,
		isLoading,
		position,
		diffSuggestion,
		confidenceScore,
		chainDepth,
		shouldShow,
	} = useFIMContext();

	const lastTextRef = useRef<string>("");
	const lastPrefixRef = useRef<string>("");
	const lastSuffixRef = useRef<string>("");
	const isManualTriggerRef = useRef(false);
	const completionIdRef = useRef<string | null>(null);
	const currentModeRef = useRef<FIMMode>("idle");
	const justCompletedRef = useRef(false);
	const currentTriggerTypeRef = useRef<FIMTriggerType | null>(null);

	// Calculate position relative to container
	const getRelativePosition = useCallback(() => {
		const container = containerRef.current;
		if (!container) return null;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return null;

		const range = selection.getRangeAt(0);
		const containerRect = container.getBoundingClientRect();

		if (range.collapsed) {
			const span = document.createElement("span");
			span.textContent = "\u200B";
			range.insertNode(span);
			const rangeRect = span.getBoundingClientRect();
			span.parentNode?.removeChild(span);

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

		const findAndAcceptGhostNodes = (node: LexicalNode) => {
			if ($isGhostTextNode(node)) {
				const textContent = node.getTextContent();
				const parent = node.getParent();

				if (parent) {
					const textNode = $createTextNode(textContent);
					node.insertBefore(textNode);
					node.remove();
					const textLength = textNode.getTextContentSize();
					textNode.select(textLength, textLength);
					accepted = true;
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
		return accepted;
	}, []);

	// Handle clearing all FIM state
	const handleClearFIM = useCallback(() => {
		editor.update(() => {
			$clearGhostTextNodes();
		});
		clearFIM();
		resetChain();
		completionIdRef.current = null;
		isManualTriggerRef.current = false;
		currentModeRef.current = "idle";
		currentTriggerTypeRef.current = null;
	}, [editor, $clearGhostTextNodes]);

	// Get cursor offset for chaining
	const getCursorOffset = useCallback((): number => {
		let offset = 0;

		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			const anchor = selection.anchor;
			const anchorNode = anchor.getNode();
			const anchorOffset = anchor.offset;

			let currentOffset = 0;
			const walkNode = (node: LexicalNode): boolean => {
				if ($isGhostTextNode(node)) return false;
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

	// Handle accepting the suggestion (with chain support)
	const handleAcceptSuggestion = useCallback(() => {
		if (!isVisible || !ghostText) return false;

		let accepted = false;
		let cursorPosition = 0;

		// Handle diff/replacement accept
		if (mode === "diff" && diffSuggestion?.type === "replace" && diffSuggestion.replaceRange) {
			editor.update(() => {
				// For replacement, we need to delete the original and insert the new
				// The ghost text already contains only the replacement content
				accepted = $acceptGhostText();
			});
		} else {
			// Normal insertion accept
			editor.update(() => {
				accepted = $acceptGhostText();
			});
		}

		// Fallback insertion if no ghost nodes
		if (!accepted && ghostText) {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const textNode = $createTextNode(ghostText);
					selection.insertNodes([textNode]);
					accepted = true;
				}
			});
		}

		if (accepted) {
			cursorPosition = getCursorOffset();
			
			// Track chain depth
			if (chainDepth < MAX_CHAIN_DEPTH) {
				incrementChainDepth(cursorPosition);
			}

			clearFIM();
			completionIdRef.current = null;
			currentModeRef.current = "idle";
			return true;
		}

		return false;
	}, [editor, ghostText, isVisible, mode, diffSuggestion, chainDepth, getCursorOffset, $acceptGhostText]);

	// Stable callbacks for useFIMCompletion
	const handleChunk = useCallback(
		(chunk: string) => {
			appendGhostText(chunk);

			const shouldInsertInline = currentModeRef.current === "copilot" || !isManualTriggerRef.current;
			
			if (shouldInsertInline) {
				editor.update(() => {
					const currentId = completionIdRef.current;
					if (!currentId) return;

					const root = $getRoot();

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
						const newText = existingGhost.getTextContent() + chunk;
						const newGhost = $createGhostTextNode(newText, currentId);
						existingGhost.replace(newGhost as LexicalNode);
						newGhost.selectPrevious();
					} else {
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
		(fullText: string, metadata?: FIMChunkMetadata) => {
			justCompletedRef.current = true;

			// Check confidence - hide if below threshold
			if (metadata && !metadata.shouldShow) {
				console.log("[FIM] Hiding suggestion due to low confidence:", metadata.confidence);
				handleClearFIM();
				return;
			}

			// Store confidence metrics
			if (metadata) {
				if (metadata.confidence !== undefined && metadata.factors) {
					setConfidence(metadata.confidence, metadata.factors, metadata.shouldShow ?? true);
				}
				if (metadata.latencyMs !== undefined && metadata.stopReason) {
					setFIMMetrics(metadata.latencyMs, metadata.stopReason);
				}
			}

			completeFIMSession();

			// Detect diff type (insert vs replace)
			const diff = detectDiffType(lastPrefixRef.current, lastSuffixRef.current, fullText);
			
			if (diff.type === "replace") {
				setDiffSuggestion(diff);
				currentModeRef.current = "diff";
				setFIMMode("diff");
			} else {
				setDiffSuggestion(null);
				// Detect regular mode based on content
				const detectedMode = detectFIMMode(fullText, {
					isManualTrigger: isManualTriggerRef.current,
				});
				currentModeRef.current = detectedMode.mode;
				setFIMMode(detectedMode.mode);
			}

			// Set position for floating panel
			if (currentModeRef.current === "cursor-tab" || currentModeRef.current === "diff") {
				const pos = getRelativePosition();
				if (pos) setFIMPosition(pos);
			}
			
			setTimeout(() => {
				justCompletedRef.current = false;
			}, 50);
		},
		[getRelativePosition, handleClearFIM],
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

	// Trigger completion request
	const triggerCompletion = useCallback(
		(options: { isManualTrigger?: boolean; triggerType?: FIMTriggerType } = {}) => {
			isManualTriggerRef.current = options.isManualTrigger ?? false;
			currentTriggerTypeRef.current = options.triggerType ?? "debounce";

			const newCompletionId = crypto.randomUUID();
			completionIdRef.current = newCompletionId;

			startFIMSession(newCompletionId, options.triggerType);

			const initialMode = options.isManualTrigger ? "cursor-tab" : "copilot";
			currentModeRef.current = initialMode;
			setFIMMode(initialMode);

			editor.getEditorState().read(() => {
				const root = $getRoot();

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

				if (!textContent.trim()) {
					clearFIM();
					return;
				}

				// For chain triggers, always continue
				if (options.triggerType !== "chain" && textContent === lastTextRef.current) {
					clearFIM();
					return;
				}
				lastTextRef.current = textContent;

				const cursorOffset = getCursorOffset();
				const { prefix, suffix } = buildFIMContext(textContent, cursorOffset);

				// Store for diff detection
				lastPrefixRef.current = prefix;
				lastSuffixRef.current = suffix;

				if (prefix.length < 10) {
					clearFIM();
					return;
				}

				// Get recent text for repetition detection
				const recentText = prefix.slice(-100);

				requestCompletion({
					prefix,
					suffix,
					contextType: "document",
					maxTokens: options.isManualTrigger ? 128 : 64,
					temperature: 0.3,
					stopSequences: options.isManualTrigger
						? ["\n\n\n"]
						: ["\n\n", ".", "!", "?"],
					triggerType: options.triggerType,
					recentText,
				});
			});
		},
		[editor, requestCompletion, getCursorOffset],
	);

	// Handle trigger events from the trigger system
	const handleTrigger = useCallback(
		(type: FIMTriggerType, _context: TriggerContext) => {
			// Don't trigger if already showing (except for chain)
			if (isVisible && type !== "chain") return;

			// For chain triggers, check depth limit
			if (type === "chain" && chainDepth >= MAX_CHAIN_DEPTH) {
				resetChain();
				return;
			}

			triggerCompletion({
				isManualTrigger: false,
				triggerType: type,
			});
		},
		[isVisible, chainDepth, triggerCompletion],
	);

	// Use the new trigger system
	const { triggerChain, cancelTriggers } = useFIMTriggers({
		onTrigger: handleTrigger,
		enabled: mode === "idle" || !isLoading,
	});

	// Tab to accept ghost text (with chaining)
	useEffect(() => {
		return editor.registerCommand(
			KEY_TAB_COMMAND,
			(event) => {
				if (isVisible && ghostText && shouldShow) {
					event.preventDefault();
					const result = handleAcceptSuggestion();
					
					// Trigger chain after accepting
					if (result && chainDepth < MAX_CHAIN_DEPTH) {
						setTimeout(() => {
							triggerChain();
						}, 50);
					}
					
					return result;
				}
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, isVisible, ghostText, shouldShow, handleAcceptSuggestion, chainDepth, triggerChain]);

	// Escape to dismiss
	useEffect(() => {
		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			() => {
				if (isVisible) {
					handleClearFIM();
					cancelTriggers();
					return true;
				}
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, isVisible, handleClearFIM, cancelTriggers]);

	// Ctrl+Space for manual trigger
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.code === "Space") {
				e.preventDefault();
				handleClearFIM();
				triggerCompletion({ isManualTrigger: true, triggerType: "debounce" });
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [triggerCompletion, handleClearFIM]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cancelTriggers();
			cancelCompletion();
			clearFIM();
		};
	}, [cancelTriggers, cancelCompletion]);

	const hasSuggestion = isVisible && !!ghostText && shouldShow;

	return (
		<>
			{/* Diff panel for replacement mode */}
			{mode === "diff" && position && diffSuggestion && (
				<FIMDiffPanel
					diff={diffSuggestion}
					position={position}
					isVisible={hasSuggestion && !isLoading}
					containerRef={containerRef}
				/>
			)}

			{/* Floating panel for cursor-tab mode */}
			{mode === "cursor-tab" && position && (
				<FIMFloatingPanel
					suggestion={ghostText}
					position={position}
					isVisible={hasSuggestion && !isLoading}
					containerRef={containerRef}
				/>
			)}

			{/* Status line with confidence and chain indicators */}
			<FIMStatusLine
				isLoading={isLoading}
				hasSuggestion={hasSuggestion}
				mode={mode}
				confidenceScore={confidenceScore}
				chainDepth={chainDepth}
			/>
		</>
	);
}

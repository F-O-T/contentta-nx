"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	$createRangeSelection,
	$setSelection,
	$isTextNode,
	$getRoot,
	KEY_DOWN_COMMAND,
	KEY_ESCAPE_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import {
	useVimContext,
	setVimMode,
	toggleVimMode,
	setPendingOperator,
	setPendingCount,
	setPendingMotion,
	setWaitingForChar,
	clearPendingState,
	enterVisualMode,
	openCommandLine,
	closeCommandLine,
	setCommandLineText,
	addToCommandHistory,
	resetCurrentRegister,
	setStatusMessage,
	clearStatusMessage,
	getVimState,
	isVisualMode,
	setLastJKeyTime,
	setJJTimeoutId,
	clearJJState,
	setCursorPosition,
} from "../context/vim-context";
import { getFIMState, clearFIM } from "../context/fim-context";
import {
	parseKey,
	createInitialCommand,
	isCommandComplete,
	type ParsedCommand,
} from "../lib/vim-key-parser";
import { useVimMotions } from "../hooks/use-vim-motions";
import { useVimOperators } from "../hooks/use-vim-operators";
import { useVimTextObjects } from "../hooks/use-vim-text-objects";
import { VimStatusLine } from "../ui/vim-status-line";
import { VimCommandLine } from "../ui/vim-command-line";
import { VimLineGutter } from "../ui/vim-line-gutter";

// ============================================================================
// Types
// ============================================================================

interface VimPluginProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
	onSave?: () => void;
	onQuit?: () => void;
}

// ============================================================================
// Main Plugin
// ============================================================================

/**
 * Vim Mode Plugin
 *
 * Provides full vim modal editing support for the Lexical editor.
 *
 * Features:
 * - Modal editing (Normal, Insert, Visual, Command modes)
 * - All common motions (hjkl, w, b, e, 0, $, gg, G, f, t, etc.)
 * - Operators (d, c, y, x, p, etc.)
 * - Visual mode (v, V, Ctrl+V)
 * - Text objects (iw, aw, i", a", etc.)
 * - Registers (unnamed, numbered, named)
 * - Ex commands (:w, :q, :wq)
 *
 * Integration:
 * - Returns false for Ctrl/Meta/Alt keys to allow other plugins to work
 * - In insert mode, passes through to allow normal editing + FIM
 * - Toggle with Ctrl+Shift+V
 */
export function VimPlugin({ containerRef, onSave, onQuit }: VimPluginProps) {
	const [editor] = useLexicalComposerContext();
	const vimState = useVimContext();

	// Hooks for vim operations
	const { moveCursor, extendSelection, getCursorPosition, executeMotion } =
		useVimMotions();
	const {
		deleteMotion,
		yankMotion,
		deleteChar,
		deleteLine,
		yankLine,
		toggleCase,
		paste,
		deleteToEndOfLine,
		deleteSelection,
		yankSelection,
	} = useVimOperators();
	const { findTextObject } = useVimTextObjects();

	// Flag to track if we're programmatically setting selection for block cursor
	const isSettingBlockCursor = useRef(false);

	// Parser state
	const commandStateRef = useRef<ParsedCommand>(createInitialCommand());
	const lastFindRef = useRef<{ motion: string; char: string } | null>(null);

	// Reset parser state
	const resetParser = useCallback(() => {
		commandStateRef.current = createInitialCommand();
		clearPendingState();
		resetCurrentRegister();
	}, []);

	// Apply block cursor by selecting one character forward (vim style)
	const applyBlockCursor = useCallback(() => {
		const currentState = getVimState();
		// Only apply in normal mode (not visual, not insert, not command)
		if (!currentState.enabled || currentState.mode !== "normal") return;

		isSettingBlockCursor.current = true;
		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			const anchor = selection.anchor;
			const anchorNode = anchor.getNode();

			// Only work with text nodes
			if (!$isTextNode(anchorNode)) return;

			const textContent = anchorNode.getTextContent();
			const currentOffset = anchor.offset;

			// If we're at or past the end of the text, try to select the last character
			if (currentOffset >= textContent.length) {
				if (textContent.length > 0) {
					// Select the last character
					selection.anchor.set(anchorNode.__key, textContent.length - 1, "text");
					selection.focus.set(anchorNode.__key, textContent.length, "text");
				}
				return;
			}

			// Select one character forward to create block cursor effect
			selection.focus.set(anchorNode.__key, currentOffset + 1, "text");
		}, { discrete: true });
		
		// Reset flag after a tick
		setTimeout(() => {
			isSettingBlockCursor.current = false;
		}, 0);
	}, [editor]);

	// Enter insert mode at various positions
	const enterInsertMode = useCallback(
		(variant: "i" | "I" | "a" | "A" | "o" | "O" | "s" | "S" | "C") => {
			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				switch (variant) {
					case "i":
						// Insert at cursor - do nothing special
						break;
					case "I":
						// Insert at beginning of line
						moveCursor("^");
						break;
					case "a":
						// Append after cursor
						moveCursor("l");
						break;
					case "A":
						// Append at end of line
						moveCursor("$");
						moveCursor("l");
						break;
					case "o":
						// Open line below
						moveCursor("$");
						// Insert newline - handled by entering insert mode and pressing Enter
						break;
					case "O":
						// Open line above
						moveCursor("0");
						// Insert newline above - handled by entering insert mode
						break;
					case "s":
						// Substitute character
						deleteChar(1, false);
						break;
					case "S":
						// Substitute line
						deleteLine(1, false);
						break;
					case "C":
						// Change to end of line
						deleteToEndOfLine();
						break;
				}
			});

			setVimMode("insert");
			resetParser();
		},
		[editor, moveCursor, deleteChar, deleteLine, deleteToEndOfLine, resetParser],
	);

	// Execute a complete vim command
	const executeCommand = useCallback(
		(cmd: ParsedCommand) => {
			const count = cmd.count || 1;
			let shouldApplyBlockCursor = false;

			switch (cmd.type) {
				case "motion":
					// Pure motion - move cursor
					if (cmd.motion) {
						if (cmd.char) {
							// f/F/t/T motion with character
							moveCursor(cmd.motion, count, cmd.char);
							lastFindRef.current = { motion: cmd.motion, char: cmd.char };
						} else {
							moveCursor(cmd.motion, count);
						}
						shouldApplyBlockCursor = true;
					}
					break;

				case "insert":
					// Enter insert mode
					if (cmd.motion) {
						enterInsertMode(cmd.motion as "i" | "I" | "a" | "A" | "o" | "O" | "s" | "S" | "C");
					}
					// Don't apply block cursor - entering insert mode
					break;

				case "action":
					// Single-key actions
					switch (cmd.motion) {
						case "x":
							deleteChar(count, false);
							shouldApplyBlockCursor = true;
							break;
						case "X":
							deleteChar(count, true);
							shouldApplyBlockCursor = true;
							break;
						case "p":
							paste(true);
							shouldApplyBlockCursor = true;
							break;
						case "P":
							paste(false);
							shouldApplyBlockCursor = true;
							break;
						case "u":
							// Undo - dispatch to Lexical
							editor.dispatchCommand(
								{ type: "undo" } as unknown as Parameters<typeof editor.dispatchCommand>[0],
								undefined,
							);
							shouldApplyBlockCursor = true;
							break;
						case ".":
							// Repeat - TODO: implement
							setStatusMessage("Repeat not yet implemented", "warning");
							break;
						case "~":
							toggleCase(count);
							shouldApplyBlockCursor = true;
							break;
						case "J":
							// Join lines - TODO: implement
							setStatusMessage("Join lines not yet implemented", "warning");
							break;
						case "D":
							deleteToEndOfLine();
							shouldApplyBlockCursor = true;
							break;
						case "Y":
							yankLine(count);
							shouldApplyBlockCursor = true;
							break;
						case "v":
							// Enter visual mode
							const pos = getCursorPosition();
							if (pos) {
								enterVisualMode("visual", { nodeKey: pos.nodeKey, offset: pos.offset });
							}
							// Don't apply block cursor - entering visual mode
							break;
						case "V":
							// Enter visual line mode
							const linePos = getCursorPosition();
							if (linePos) {
								enterVisualMode("visual-line", { nodeKey: linePos.nodeKey, offset: linePos.offset });
							}
							// Don't apply block cursor - entering visual mode
							break;
						case ":":
							// Enter command mode
							openCommandLine();
							// Don't apply block cursor - entering command mode
							break;
					}
					break;

				case "operator":
					// Operator with motion or text object
					if (cmd.operator && (cmd.motion || cmd.textObject)) {
						let motionResult = null;

						if (cmd.textObject && cmd.textObjectModifier) {
							// Text object
							motionResult = findTextObject(
								cmd.textObjectModifier,
								cmd.textObject,
							);
						} else if (cmd.motion) {
							// Motion
							if (cmd.motion === cmd.operator) {
								// Line operation (dd, cc, yy)
								switch (cmd.operator) {
									case "d":
										deleteLine(count, false);
										shouldApplyBlockCursor = true;
										break;
									case "c":
										deleteLine(count, true);
										// Don't apply - entering insert mode
										break;
									case "y":
										yankLine(count);
										shouldApplyBlockCursor = true;
										break;
								}
								resetParser();
								if (shouldApplyBlockCursor) {
									setTimeout(() => applyBlockCursor(), 0);
								}
								return;
							}

							// Regular motion
							motionResult = executeMotion(cmd.motion, count, cmd.char ?? undefined);
							if (cmd.char) {
								lastFindRef.current = { motion: cmd.motion, char: cmd.char };
							}
						}

						if (motionResult) {
							switch (cmd.operator) {
								case "d":
									deleteMotion(motionResult, false);
									shouldApplyBlockCursor = true;
									break;
								case "c":
									deleteMotion(motionResult, true);
									// Don't apply - entering insert mode
									break;
								case "y":
									yankMotion(motionResult);
									shouldApplyBlockCursor = true;
									break;
							}
						}
					}
					break;

				case "text-object":
					// Text object in visual mode
					if (cmd.textObject && cmd.textObjectModifier) {
						const objResult = findTextObject(
							cmd.textObjectModifier,
							cmd.textObject,
						);
						if (objResult) {
							// Extend visual selection
							editor.update(() => {
								const selection = $createRangeSelection();
								selection.anchor.set(
									objResult.anchor.nodeKey,
									objResult.anchor.offset,
									"text",
								);
								selection.focus.set(
									objResult.head.nodeKey,
									objResult.head.offset,
									"text",
								);
								$setSelection(selection);
							});
						}
					}
					// In visual mode - don't apply block cursor
					break;
			}

			resetParser();
			
			// Apply block cursor after operations that stay in normal mode
			if (shouldApplyBlockCursor) {
				setTimeout(() => applyBlockCursor(), 0);
			}
		},
		[
			editor,
			moveCursor,
			executeMotion,
			enterInsertMode,
			deleteChar,
			deleteMotion,
			yankMotion,
			findTextObject,
			deleteLine,
			yankLine,
			toggleCase,
			paste,
			deleteToEndOfLine,
			getCursorPosition,
			resetParser,
			applyBlockCursor,
		],
	);

	// Handle key in normal/visual mode
	const handleVimKey = useCallback(
		(event: KeyboardEvent): boolean => {
			const key = event.key;
			const vimState = getVimState();

			// Handle visual mode motions
			if (isVisualMode(vimState.mode)) {
				// In visual mode, motions extend selection
				const simpleMotions = ["h", "j", "k", "l", "w", "W", "b", "B", "e", "E", "0", "$", "^", "{", "}", "G"];
				if (simpleMotions.includes(key)) {
					extendSelection(key);
					return true;
				}

				// gg in visual mode
				if (key === "g") {
					commandStateRef.current = parseKey(key, commandStateRef.current);
					if (commandStateRef.current.waitingFor === "g-command") {
						return true;
					}
				}

				// Visual mode operators
				if (key === "d" || key === "x") {
					deleteSelection(false);
					resetParser();
					return true;
				}
				if (key === "c" || key === "s") {
					deleteSelection(true);
					resetParser();
					return true;
				}
				if (key === "y") {
					yankSelection();
					resetParser();
					return true;
				}

				// Switch visual mode type
				if (key === "v" && vimState.mode !== "visual") {
					setVimMode("visual");
					return true;
				}
				if (key === "V" && vimState.mode !== "visual-line") {
					setVimMode("visual-line");
					return true;
				}

				// Escape exits visual mode
				if (key === "Escape") {
					setVimMode("normal");
					resetParser();
					// Collapse selection
					editor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							selection.anchor.set(
								selection.focus.key,
								selection.focus.offset,
								selection.focus.type,
							);
						}
					});
					return true;
				}
			}

			// Parse the key
			commandStateRef.current = parseKey(key, commandStateRef.current);

			// Update pending state display
			if (commandStateRef.current.operator && !commandStateRef.current.motion) {
				setPendingOperator(commandStateRef.current.operator);
			}
			if (commandStateRef.current.count > 1) {
				setPendingCount(commandStateRef.current.count);
			}
			if (commandStateRef.current.waitingFor === "char") {
				setWaitingForChar(true);
				setPendingMotion(commandStateRef.current.motion);
			}

			// Check if command is complete
			if (isCommandComplete(commandStateRef.current)) {
				executeCommand(commandStateRef.current);
				return true;
			}

			// Command still building - consumed the key
			if (commandStateRef.current.sequence.length > 0) {
				return true;
			}

			// Unknown key - reset and don't consume
			resetParser();
			return false;
		},
		[editor, extendSelection, deleteSelection, yankSelection, executeCommand, resetParser],
	);

	// Handle command line key
	const handleCommandLineKey = useCallback(
		(event: KeyboardEvent) => {
			const key = event.key;
			const vimState = getVimState();

			if (key === "Escape") {
				closeCommandLine();
				return;
			}

			if (key === "Enter") {
				const command = vimState.commandLineText.trim();
				if (command) {
					addToCommandHistory(command);

					// Execute command
					switch (command) {
						case "w":
							onSave?.();
							setStatusMessage("Saved", "info");
							break;
						case "q":
							onQuit?.();
							break;
						case "wq":
						case "x":
							onSave?.();
							onQuit?.();
							break;
						case "q!":
							onQuit?.();
							break;
						default:
							setStatusMessage(`Unknown command: ${command}`, "error");
					}
				}
				closeCommandLine();
				return;
			}

			if (key === "Backspace") {
				const text = vimState.commandLineText;
				if (text.length > 0) {
					setCommandLineText(text.slice(0, -1));
				} else {
					closeCommandLine();
				}
				return;
			}

			// Regular character input
			if (key.length === 1) {
				setCommandLineText(vimState.commandLineText + key);
			}
		},
		[onSave, onQuit],
	);

	// Main key handler - registered at CRITICAL priority
	useEffect(() => {
		if (!vimState.enabled) return;

		return editor.registerCommand(
			KEY_DOWN_COMMAND,
			(event: KeyboardEvent) => {
				// CRITICAL: Allow modifier combinations to pass through
				// This lets Ctrl+K (edit), Ctrl+L (chat), etc. work
				if (event.ctrlKey || event.metaKey || event.altKey) {
					// Exception: Ctrl+V for visual block mode
					if (event.ctrlKey && event.key === "v" && vimState.mode !== "insert") {
						event.preventDefault();
						const pos = getCursorPosition();
						if (pos) {
							enterVisualMode("visual-block", { nodeKey: pos.nodeKey, offset: pos.offset });
						}
						return true;
					}
					return false;
				}

				const currentMode = getVimState().mode;

				// Command mode - handle in command line
				if (currentMode === "command") {
					event.preventDefault();
					handleCommandLineKey(event);
					return true;
				}

				// Insert mode - only intercept Escape and jj
				if (currentMode === "insert") {
					if (event.key === "Escape") {
						// Check if FIM suggestion is visible
						const fimState = getFIMState();
						
						if (fimState.isVisible) {
							// First ESC: dismiss FIM, stay in insert mode
							clearFIM();
							return true;
						}
						
						// Second ESC (or no FIM): exit insert mode
						clearJJState(); // Clear any pending jj state
						setVimMode("normal");
						resetParser();
						// Move cursor back one position (vim behavior)
						moveCursor("h");
						// Apply block cursor after small delay
						setTimeout(() => applyBlockCursor(), 10);
						return true;
					}

					// jj escape detection (150ms timeout)
					if (event.key === "j") {
						const now = Date.now();
						const currentVimState = getVimState();
						const JJ_TIMEOUT = 150;

						if (currentVimState.lastJKeyTime && (now - currentVimState.lastJKeyTime) < JJ_TIMEOUT) {
							// Second 'j' within timeout - exit insert mode
							event.preventDefault();
							
							// Delete the first 'j' that was typed
							editor.update(() => {
								const selection = $getSelection();
								if ($isRangeSelection(selection)) {
									selection.deleteCharacter(true); // Delete backwards
								}
							});

							clearJJState();
							setVimMode("normal");
							resetParser();
							moveCursor("h");
							setTimeout(() => applyBlockCursor(), 10);
							return true;
						}

						// First 'j' - start tracking
						setLastJKeyTime(now);
						const timeoutId = window.setTimeout(() => {
							clearJJState();
						}, JJ_TIMEOUT);
						setJJTimeoutId(timeoutId);
						
						// Let the 'j' pass through to the editor
						return false;
					}

					// Any other key clears jj tracking
					if (getVimState().lastJKeyTime) {
						clearJJState();
					}

					// Let all other keys pass through (normal typing, FIM Tab, etc.)
					return false;
				}

				// Normal/Visual mode - process vim keys
				event.preventDefault();
				return handleVimKey(event);
			},
			COMMAND_PRIORITY_CRITICAL,
		);
	}, [
		editor,
		vimState.enabled,
		vimState.mode,
		handleVimKey,
		handleCommandLineKey,
		getCursorPosition,
		moveCursor,
		resetParser,
		applyBlockCursor,
	]);

	// Toggle shortcut (Ctrl+Shift+V)
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.shiftKey && event.key === "V") {
				event.preventDefault();
				toggleVimMode();

				const newState = getVimState();
				setStatusMessage(
					newState.enabled ? "Vim mode enabled" : "Vim mode disabled",
					"info",
				);

				// Clear message after 2 seconds
				setTimeout(() => {
					clearStatusMessage();
				}, 2000);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Escape handler for vim modes (backup)
	useEffect(() => {
		if (!vimState.enabled) return;

		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			() => {
				const currentMode = getVimState().mode;

				if (currentMode === "command") {
					closeCommandLine();
					return true;
				}

				if (currentMode !== "normal") {
					setVimMode("normal");
					resetParser();

					// Collapse selection in visual modes
					if (isVisualMode(currentMode)) {
						editor.update(() => {
							const selection = $getSelection();
							if ($isRangeSelection(selection)) {
								selection.anchor.set(
									selection.focus.key,
									selection.focus.offset,
									selection.focus.type,
								);
							}
						});
					}

					return true;
				}

				// In normal mode, reset any pending state
				if (commandStateRef.current.sequence.length > 0) {
					resetParser();
					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, vimState.enabled, resetParser]);

	// Apply cursor styling and gutter padding
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const editable = container.querySelector('[contenteditable="true"]');
		if (!editable) return;

		const el = editable as HTMLElement;

		if (vimState.enabled) {
			// Add gutter padding
			el.classList.add("vim-gutter-enabled");
		} else {
			el.classList.remove("vim-gutter-enabled");
		}

		if (!vimState.enabled || vimState.mode === "insert") {
			// Normal cursor
			el.style.caretColor = "";
			el.classList.remove("vim-normal-cursor");
		} else {
			// Block cursor for normal/visual modes
			el.classList.add("vim-normal-cursor");
		}

		return () => {
			el.style.caretColor = "";
			el.classList.remove("vim-normal-cursor");
			el.classList.remove("vim-gutter-enabled");
		};
	}, [containerRef, vimState.enabled, vimState.mode]);

	// Apply block cursor when entering normal mode
	useEffect(() => {
		if (vimState.enabled && vimState.mode === "normal") {
			// Small delay to ensure selection is updated first
			const timeoutId = setTimeout(() => {
				applyBlockCursor();
			}, 10);
			return () => clearTimeout(timeoutId);
		}
	}, [vimState.enabled, vimState.mode, applyBlockCursor]);

	// Re-apply block cursor on selection change (e.g., when user clicks)
	useEffect(() => {
		if (!vimState.enabled || vimState.mode !== "normal") return;

		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				// Only apply if we're not already setting the block cursor
				if (!isSettingBlockCursor.current) {
					// Small delay to let the click finish
					setTimeout(() => {
						applyBlockCursor();
					}, 0);
				}
				return false; // Don't block other handlers
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, vimState.enabled, vimState.mode, applyBlockCursor]);

	// Track cursor position for status line
	useEffect(() => {
		if (!vimState.enabled) return;

		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				editor.getEditorState().read(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return;

					const anchor = selection.anchor;
					const anchorNode = anchor.getNode();
					const topElement = anchorNode.getTopLevelElement();

					if (!topElement) return;

					const root = $getRoot();
					const children = root.getChildren();
					const line = children.indexOf(topElement) + 1;
					const column = anchor.offset + 1;

					setCursorPosition(line, column);
				});
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, vimState.enabled]);

	// Render UI components
	return (
		<>
			{/* Line number gutter */}
			<VimLineGutter enabled={vimState.enabled} containerRef={containerRef} />

			{/* Status line */}
			<VimStatusLine
				enabled={vimState.enabled}
				mode={vimState.mode}
				pendingOperator={vimState.pendingOperator}
				pendingCount={vimState.pendingCount}
				pendingMotion={vimState.pendingMotion}
				currentRegister={vimState.currentRegister}
				statusMessage={vimState.statusMessage}
				statusMessageType={vimState.statusMessageType}
				cursorLine={vimState.cursorLine}
				cursorColumn={vimState.cursorColumn}
				onToggle={toggleVimMode}
			/>

			{/* Command line */}
			{vimState.mode === "command" && (
				<VimCommandLine
					text={vimState.commandLineText}
					isVisible={vimState.commandLineVisible}
				/>
			)}

			{/* Inject cursor styles for vim modes */}
			<style>{`
				/* Hide native caret in normal/visual modes */
				.vim-normal-cursor {
					caret-color: transparent !important;
				}

				/* Block cursor using selection highlight */
				.vim-normal-cursor ::selection {
					background: hsl(var(--primary)) !important;
					color: hsl(var(--primary-foreground)) !important;
				}
				
				.vim-normal-cursor *::selection {
					background: hsl(var(--primary)) !important;
					color: hsl(var(--primary-foreground)) !important;
				}

				/* Add left padding for line number gutter */
				.vim-gutter-enabled {
					padding-left: 3.5rem !important;
				}
			`}</style>
		</>
	);
}

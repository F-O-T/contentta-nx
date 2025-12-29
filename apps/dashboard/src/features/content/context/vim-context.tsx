import { Store, useStore } from "@tanstack/react-store";

// ============================================================================
// Types
// ============================================================================

export type VimMode =
	| "normal"
	| "insert"
	| "visual"
	| "visual-line"
	| "visual-block"
	| "command";

export interface VimRegister {
	content: string;
	type: "char" | "line" | "block";
}

export interface VimPosition {
	nodeKey: string;
	offset: number;
}

interface VimState {
	// Core state
	enabled: boolean;
	mode: VimMode;

	// Pending operation state
	pendingOperator: string | null;
	pendingCount: number | null;
	pendingMotion: string | null;
	waitingForChar: boolean;

	// Visual mode state
	visualAnchor: VimPosition | null;
	visualHead: VimPosition | null;

	// Command line state
	commandLineText: string;
	commandLineVisible: boolean;
	commandLineHistory: string[];
	commandLineHistoryIndex: number;

	// Registers
	registers: Record<string, VimRegister>;
	currentRegister: string;

	// Last operation (for dot repeat)
	lastOperation: {
		operator: string;
		motion: string;
		count: number;
		text?: string;
	} | null;

	// Status message
	statusMessage: string | null;
	statusMessageType: "info" | "error" | "warning";

	// jj escape tracking
	lastJKeyTime: number | null;
	jjTimeoutId: number | null;

	// Cursor position tracking
	cursorLine: number;
	cursorColumn: number;
}

// ============================================================================
// Initial State
// ============================================================================

const STORAGE_KEY = "vim-mode-enabled";

const getInitialEnabled = (): boolean => {
	if (typeof window === "undefined") return false;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === "true";
};

const initialState: VimState = {
	// Core state
	enabled: getInitialEnabled(),
	mode: "normal",

	// Pending operation
	pendingOperator: null,
	pendingCount: null,
	pendingMotion: null,
	waitingForChar: false,

	// Visual mode
	visualAnchor: null,
	visualHead: null,

	// Command line
	commandLineText: "",
	commandLineVisible: false,
	commandLineHistory: [],
	commandLineHistoryIndex: -1,

	// Registers
	registers: {
		'"': { content: "", type: "char" }, // Unnamed register
		"0": { content: "", type: "char" }, // Yank register
	},
	currentRegister: '"',

	// Last operation
	lastOperation: null,

	// Status
	statusMessage: null,
	statusMessageType: "info",

	// jj escape tracking
	lastJKeyTime: null,
	jjTimeoutId: null,

	// Cursor position tracking
	cursorLine: 1,
	cursorColumn: 1,
};

// ============================================================================
// Store
// ============================================================================

const vimStore = new Store<VimState>(initialState);

// ============================================================================
// Core Actions
// ============================================================================

/**
 * Enable or disable vim mode
 */
export const setVimEnabled = (enabled: boolean) => {
	if (typeof window !== "undefined") {
		localStorage.setItem(STORAGE_KEY, String(enabled));
	}
	vimStore.setState((state) => ({
		...state,
		enabled,
		mode: enabled ? "normal" : "normal",
		pendingOperator: null,
		pendingCount: null,
		pendingMotion: null,
		waitingForChar: false,
	}));
};

/**
 * Toggle vim mode on/off
 */
export const toggleVimMode = () => {
	const current = vimStore.state.enabled;
	setVimEnabled(!current);
};

/**
 * Set the current vim mode
 */
export const setVimMode = (mode: VimMode) =>
	vimStore.setState((state) => ({
		...state,
		mode,
		// Clear pending state when changing modes (except to command)
		...(mode !== "command" && mode !== state.mode
			? {
					pendingOperator: null,
					pendingCount: null,
					pendingMotion: null,
					waitingForChar: false,
				}
			: {}),
		// Clear visual anchors when leaving visual modes
		...(mode !== "visual" &&
		mode !== "visual-line" &&
		mode !== "visual-block" &&
		(state.mode === "visual" ||
			state.mode === "visual-line" ||
			state.mode === "visual-block")
			? {
					visualAnchor: null,
					visualHead: null,
				}
			: {}),
	}));

// ============================================================================
// Pending Operation Actions
// ============================================================================

/**
 * Set pending operator (d, c, y, etc.)
 */
export const setPendingOperator = (operator: string | null) =>
	vimStore.setState((state) => ({
		...state,
		pendingOperator: operator,
	}));

/**
 * Set pending count
 */
export const setPendingCount = (count: number | null) =>
	vimStore.setState((state) => ({
		...state,
		pendingCount: count,
	}));

/**
 * Append digit to pending count
 */
export const appendPendingCount = (digit: number) =>
	vimStore.setState((state) => ({
		...state,
		pendingCount: state.pendingCount ? state.pendingCount * 10 + digit : digit,
	}));

/**
 * Set pending motion (for multi-char motions like f, t)
 */
export const setPendingMotion = (motion: string | null) =>
	vimStore.setState((state) => ({
		...state,
		pendingMotion: motion,
		waitingForChar: motion !== null && ["f", "F", "t", "T", "r"].includes(motion),
	}));

/**
 * Set waiting for character input
 */
export const setWaitingForChar = (waiting: boolean) =>
	vimStore.setState((state) => ({
		...state,
		waitingForChar: waiting,
	}));

/**
 * Clear all pending state
 */
export const clearPendingState = () =>
	vimStore.setState((state) => ({
		...state,
		pendingOperator: null,
		pendingCount: null,
		pendingMotion: null,
		waitingForChar: false,
	}));

// ============================================================================
// Visual Mode Actions
// ============================================================================

/**
 * Set visual mode anchor position
 */
export const setVisualAnchor = (anchor: VimPosition | null) =>
	vimStore.setState((state) => ({
		...state,
		visualAnchor: anchor,
	}));

/**
 * Set visual mode head (cursor) position
 */
export const setVisualHead = (head: VimPosition | null) =>
	vimStore.setState((state) => ({
		...state,
		visualHead: head,
	}));

/**
 * Enter visual mode at current position
 */
export const enterVisualMode = (
	mode: "visual" | "visual-line" | "visual-block",
	position: VimPosition,
) =>
	vimStore.setState((state) => ({
		...state,
		mode,
		visualAnchor: position,
		visualHead: position,
	}));

/**
 * Update visual selection (move head)
 */
export const updateVisualSelection = (head: VimPosition) =>
	vimStore.setState((state) => ({
		...state,
		visualHead: head,
	}));

// ============================================================================
// Command Line Actions
// ============================================================================

/**
 * Open the command line
 */
export const openCommandLine = () =>
	vimStore.setState((state) => ({
		...state,
		mode: "command",
		commandLineVisible: true,
		commandLineText: "",
		commandLineHistoryIndex: -1,
	}));

/**
 * Close the command line
 */
export const closeCommandLine = () =>
	vimStore.setState((state) => ({
		...state,
		mode: "normal",
		commandLineVisible: false,
		commandLineText: "",
	}));

/**
 * Set command line text
 */
export const setCommandLineText = (text: string) =>
	vimStore.setState((state) => ({
		...state,
		commandLineText: text,
	}));

/**
 * Add command to history
 */
export const addToCommandHistory = (command: string) =>
	vimStore.setState((state) => ({
		...state,
		commandLineHistory: [
			command,
			...state.commandLineHistory.filter((c) => c !== command).slice(0, 49),
		],
	}));

/**
 * Navigate command history
 */
export const navigateCommandHistory = (direction: "up" | "down") =>
	vimStore.setState((state) => {
		const history = state.commandLineHistory;
		if (history.length === 0) return state;

		let newIndex: number;
		if (direction === "up") {
			newIndex = Math.min(
				state.commandLineHistoryIndex + 1,
				history.length - 1,
			);
		} else {
			newIndex = Math.max(state.commandLineHistoryIndex - 1, -1);
		}

		return {
			...state,
			commandLineHistoryIndex: newIndex,
			commandLineText: newIndex >= 0 ? (history[newIndex] ?? "") : "",
		};
	});

// ============================================================================
// Register Actions
// ============================================================================

/**
 * Set register content
 */
export const setRegister = (name: string, register: VimRegister) =>
	vimStore.setState((state) => ({
		...state,
		registers: {
			...state.registers,
			[name]: register,
		},
	}));

/**
 * Set current register for next operation
 */
export const setCurrentRegister = (name: string) =>
	vimStore.setState((state) => ({
		...state,
		currentRegister: name,
	}));

/**
 * Reset current register to unnamed
 */
export const resetCurrentRegister = () =>
	vimStore.setState((state) => ({
		...state,
		currentRegister: '"',
	}));

/**
 * Yank text to register
 */
export const yankToRegister = (
	content: string,
	type: "char" | "line" | "block",
	targetRegister?: string,
) =>
	vimStore.setState((state) => {
		const reg = targetRegister || state.currentRegister;
		const register: VimRegister = { content, type };

		const newRegisters = { ...state.registers };

		// Always update unnamed register
		newRegisters['"'] = register;

		// Update yank register
		newRegisters["0"] = register;

		// If specific register was selected, update it too
		if (reg !== '"' && reg !== "0") {
			newRegisters[reg] = register;
		}

		return {
			...state,
			registers: newRegisters,
			currentRegister: '"', // Reset after operation
		};
	});

/**
 * Delete text to register (shifts numbered registers)
 */
export const deleteToRegister = (
	content: string,
	type: "char" | "line" | "block",
	targetRegister?: string,
) =>
	vimStore.setState((state) => {
		const reg = targetRegister || state.currentRegister;
		const register: VimRegister = { content, type };

		const newRegisters = { ...state.registers };

		// Always update unnamed register
		newRegisters['"'] = register;

		// Shift numbered registers 1-9
		for (let i = 9; i >= 2; i--) {
			const prev = newRegisters[String(i - 1)];
			if (prev) {
				newRegisters[String(i)] = prev;
			}
		}
		newRegisters["1"] = register;

		// If specific register was selected, update it too
		if (reg !== '"' && !reg.match(/^[0-9]$/)) {
			newRegisters[reg] = register;
		}

		return {
			...state,
			registers: newRegisters,
			currentRegister: '"', // Reset after operation
		};
	});

// ============================================================================
// Last Operation Actions
// ============================================================================

/**
 * Record last operation for dot repeat
 */
export const recordLastOperation = (operation: {
	operator: string;
	motion: string;
	count: number;
	text?: string;
}) =>
	vimStore.setState((state) => ({
		...state,
		lastOperation: operation,
	}));

// ============================================================================
// Status Message Actions
// ============================================================================

/**
 * Set status message
 */
export const setStatusMessage = (
	message: string | null,
	type: "info" | "error" | "warning" = "info",
) =>
	vimStore.setState((state) => ({
		...state,
		statusMessage: message,
		statusMessageType: type,
	}));

/**
 * Clear status message
 */
export const clearStatusMessage = () =>
	vimStore.setState((state) => ({
		...state,
		statusMessage: null,
	}));

// ============================================================================
// jj Escape Actions
// ============================================================================

/**
 * Set last J key time for jj escape detection
 */
export const setLastJKeyTime = (time: number | null) =>
	vimStore.setState((state) => ({ ...state, lastJKeyTime: time }));

/**
 * Set jj timeout ID
 */
export const setJJTimeoutId = (id: number | null) =>
	vimStore.setState((state) => ({ ...state, jjTimeoutId: id }));

/**
 * Clear jj escape tracking state
 */
export const clearJJState = () =>
	vimStore.setState((state) => {
		if (state.jjTimeoutId) {
			clearTimeout(state.jjTimeoutId);
		}
		return { ...state, lastJKeyTime: null, jjTimeoutId: null };
	});

// ============================================================================
// Cursor Position Actions
// ============================================================================

/**
 * Set cursor position (line and column)
 */
export const setCursorPosition = (line: number, column: number) =>
	vimStore.setState((state) => ({ ...state, cursorLine: line, cursorColumn: column }));

// ============================================================================
// Reset Actions
// ============================================================================

/**
 * Reset vim state to initial (keeps enabled state)
 */
export const resetVim = () =>
	vimStore.setState((state) => ({
		...initialState,
		enabled: state.enabled,
		registers: state.registers, // Keep registers
		commandLineHistory: state.commandLineHistory, // Keep history
	}));

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access vim state
 */
export const useVimContext = () => {
	const state = useStore(vimStore);
	return state;
};

/**
 * Hook to access just vim state (read-only)
 */
export const useVimState = () => {
	return useStore(vimStore);
};

/**
 * Get current vim state synchronously (for use outside React)
 */
export const getVimState = () => vimStore.state;

/**
 * Check if vim is in a visual mode
 */
export const isVisualMode = (mode: VimMode): boolean =>
	mode === "visual" || mode === "visual-line" || mode === "visual-block";

/**
 * Get display name for mode
 */
export const getModeName = (mode: VimMode): string => {
	const names: Record<VimMode, string> = {
		normal: "NORMAL",
		insert: "INSERT",
		visual: "VISUAL",
		"visual-line": "VISUAL LINE",
		"visual-block": "VISUAL BLOCK",
		command: "COMMAND",
	};
	return names[mode];
};

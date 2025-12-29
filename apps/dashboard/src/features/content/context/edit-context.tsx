import { Store, useStore } from "@tanstack/react-store";

export type EditPhase = "idle" | "prompting" | "streaming" | "complete";

interface EditPosition {
	top: number;
	left: number;
}

interface SelectionState {
	anchorKey: string;
	anchorOffset: number;
	focusKey: string;
	focusOffset: number;
}

interface EditState {
	phase: EditPhase;
	position: EditPosition | null;
	selectedText: string;
	instruction: string;
	streamedResult: string;
	originalSelection: SelectionState | null;
	placeholderNodeKey: string | null;
	editId: string | null;
	error: Error | null;
}

const initialState: EditState = {
	phase: "idle",
	position: null,
	selectedText: "",
	instruction: "",
	streamedResult: "",
	originalSelection: null,
	placeholderNodeKey: null,
	editId: null,
	error: null,
};

const editStore = new Store<EditState>(initialState);

/**
 * Open the edit prompt with selection info
 */
export const openEditPrompt = (params: {
	selectedText: string;
	position: EditPosition;
	originalSelection: SelectionState;
}) =>
	editStore.setState((state) => ({
		...state,
		phase: "prompting" as EditPhase,
		selectedText: params.selectedText,
		position: params.position,
		originalSelection: params.originalSelection,
		editId: crypto.randomUUID(),
		instruction: "",
		streamedResult: "",
		error: null,
	}));

/**
 * Set the instruction text
 */
export const setEditInstruction = (instruction: string) =>
	editStore.setState((state) => ({
		...state,
		instruction,
	}));

/**
 * Start streaming the edit result
 */
export const startEditStreaming = () =>
	editStore.setState((state) => ({
		...state,
		phase: "streaming" as EditPhase,
		streamedResult: "",
	}));

/**
 * Append text to the streamed result
 */
export const appendEditStreamedText = (chunk: string) =>
	editStore.setState((state) => ({
		...state,
		streamedResult: state.streamedResult + chunk,
	}));

/**
 * Set the placeholder node key for streaming updates
 */
export const setEditPlaceholderNodeKey = (key: string | null) =>
	editStore.setState((state) => ({
		...state,
		placeholderNodeKey: key,
	}));

/**
 * Complete the edit operation
 */
export const completeEdit = () =>
	editStore.setState((state) => ({
		...state,
		phase: "complete" as EditPhase,
	}));

/**
 * Cancel the edit operation
 */
export const cancelEdit = () =>
	editStore.setState(() => ({
		...initialState,
	}));

/**
 * Set error state
 */
export const setEditError = (error: Error | null) =>
	editStore.setState((state) => ({
		...state,
		error,
		phase: error ? "idle" : state.phase,
	}));

/**
 * Clear all edit state
 */
export const clearEdit = () =>
	editStore.setState(() => ({
		...initialState,
	}));

/**
 * Hook to access edit state and actions
 */
export const useEditContext = () => {
	const state = useStore(editStore);

	return {
		...state,
		openEditPrompt,
		setEditInstruction,
		startEditStreaming,
		appendEditStreamedText,
		setEditPlaceholderNodeKey,
		completeEdit,
		cancelEdit,
		setEditError,
		clearEdit,
	};
};

/**
 * Hook to access just the edit state (for read-only consumers)
 */
export const useEditState = () => {
	return useStore(editStore);
};

/**
 * Get current edit state synchronously (for use outside React)
 */
export const getEditState = () => editStore.state;

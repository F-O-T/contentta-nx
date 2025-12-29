import { Store, useStore } from "@tanstack/react-store";

export type FIMMode = "copilot" | "cursor-tab" | "idle";

interface FIMPosition {
	top: number;
	left: number;
	maxWidth?: number;
}

interface FIMState {
	mode: FIMMode;
	ghostText: string;
	isVisible: boolean;
	isLoading: boolean;
	position: FIMPosition | null;
	completionId: string | null;
}

const initialState: FIMState = {
	mode: "idle",
	ghostText: "",
	isVisible: false,
	isLoading: false,
	position: null,
	completionId: null,
};

const fimStore = new Store<FIMState>(initialState);

/**
 * Set the current FIM mode
 */
export const setFIMMode = (mode: FIMMode) =>
	fimStore.setState((state) => ({
		...state,
		mode,
	}));

/**
 * Set ghost text content with a new completion ID
 */
export const setGhostText = (text: string, completionId?: string) =>
	fimStore.setState((state) => ({
		...state,
		ghostText: text,
		isVisible: text.length > 0,
		completionId: completionId ?? state.completionId ?? crypto.randomUUID(),
	}));

/**
 * Append text to existing ghost text (for streaming)
 */
export const appendGhostText = (chunk: string) =>
	fimStore.setState((state) => ({
		...state,
		ghostText: state.ghostText + chunk,
		isVisible: true,
	}));

/**
 * Set the position for floating panel
 */
export const setFIMPosition = (position: FIMPosition | null) =>
	fimStore.setState((state) => ({
		...state,
		position,
	}));

/**
 * Set loading state
 */
export const setFIMLoading = (isLoading: boolean) =>
	fimStore.setState((state) => ({
		...state,
		isLoading,
	}));

/**
 * Clear all FIM state
 */
export const clearFIM = () =>
	fimStore.setState(() => ({
		...initialState,
	}));

/**
 * Start a new FIM completion session
 */
export const startFIMSession = (completionId: string) =>
	fimStore.setState((state) => ({
		...state,
		ghostText: "",
		isVisible: false,
		isLoading: true,
		completionId,
	}));

/**
 * Complete a FIM session (stop loading, keep suggestion visible)
 */
export const completeFIMSession = () =>
	fimStore.setState((state) => ({
		...state,
		isLoading: false,
	}));

/**
 * Hook to access FIM state and actions
 */
export const useFIMContext = () => {
	const state = useStore(fimStore);

	return {
		...state,
		setFIMMode,
		setGhostText,
		appendGhostText,
		setFIMPosition,
		setFIMLoading,
		clearFIM,
		startFIMSession,
		completeFIMSession,
	};
};

/**
 * Hook to access just the FIM state (for read-only consumers)
 */
export const useFIMState = () => {
	return useStore(fimStore);
};

/**
 * Get current FIM state synchronously (for use outside React)
 */
export const getFIMState = () => fimStore.state;

import { Store, useStore } from "@tanstack/react-store";
import type {
	FIMConfidenceFactors,
	FIMDiffSuggestion,
	FIMTriggerType,
} from "@packages/fim";

export type FIMMode = "copilot" | "cursor-tab" | "diff" | "idle";

interface FIMPosition {
	top: number;
	left: number;
	maxWidth?: number;
}

interface FIMState {
	// Display state
	mode: FIMMode;
	ghostText: string;
	isVisible: boolean;
	isLoading: boolean;
	position: FIMPosition | null;
	completionId: string | null;

	// Trigger tracking
	triggerType: FIMTriggerType | null;
	isManualTrigger: boolean;

	// Confidence scoring
	confidenceScore: number | null;
	confidenceFactors: FIMConfidenceFactors | null;
	shouldShow: boolean;

	// Diff state
	diffSuggestion: FIMDiffSuggestion | null;

	// Chain state
	chainDepth: number;
	lastAcceptPosition: number | null;
	isPreFetching: boolean;
	prefetchedSuggestion: string | null;

	// Metrics (for debugging/analytics)
	lastLatencyMs: number | null;
	lastStopReason: string | null;
}

const initialState: FIMState = {
	// Display state
	mode: "idle",
	ghostText: "",
	isVisible: false,
	isLoading: false,
	position: null,
	completionId: null,

	// Trigger tracking
	triggerType: null,
	isManualTrigger: false,

	// Confidence
	confidenceScore: null,
	confidenceFactors: null,
	shouldShow: true,

	// Diff
	diffSuggestion: null,

	// Chain
	chainDepth: 0,
	lastAcceptPosition: null,
	isPreFetching: false,
	prefetchedSuggestion: null,

	// Metrics
	lastLatencyMs: null,
	lastStopReason: null,
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
export const startFIMSession = (
	completionId: string,
	triggerType?: FIMTriggerType,
	isManualTrigger = false,
) =>
	fimStore.setState((state) => ({
		...state,
		ghostText: "",
		isVisible: false,
		isLoading: true,
		completionId,
		triggerType: triggerType ?? null,
		isManualTrigger,
		// Reset confidence/diff for new session
		confidenceScore: null,
		confidenceFactors: null,
		shouldShow: true,
		diffSuggestion: null,
	}));

/**
 * Complete a FIM session (stop loading, keep suggestion visible)
 */
export const completeFIMSession = () =>
	fimStore.setState((state) => ({
		...state,
		isLoading: false,
	}));

// ============================================================================
// Confidence Actions
// ============================================================================

/**
 * Set confidence scoring results
 */
export const setConfidence = (
	score: number,
	factors: FIMConfidenceFactors,
	shouldShow: boolean,
) =>
	fimStore.setState((state) => ({
		...state,
		confidenceScore: score,
		confidenceFactors: factors,
		shouldShow,
	}));

/**
 * Set metrics from server response
 */
export const setFIMMetrics = (latencyMs: number, stopReason: string) =>
	fimStore.setState((state) => ({
		...state,
		lastLatencyMs: latencyMs,
		lastStopReason: stopReason,
	}));

// ============================================================================
// Diff Actions
// ============================================================================

/**
 * Set diff suggestion for replacement mode
 */
export const setDiffSuggestion = (diff: FIMDiffSuggestion | null) =>
	fimStore.setState((state) => ({
		...state,
		diffSuggestion: diff,
		mode: diff?.type === "replace" ? "diff" : state.mode,
	}));

// ============================================================================
// Chain Actions
// ============================================================================

/**
 * Increment chain depth after accepting a suggestion
 */
export const incrementChainDepth = (acceptPosition: number) =>
	fimStore.setState((state) => ({
		...state,
		chainDepth: state.chainDepth + 1,
		lastAcceptPosition: acceptPosition,
	}));

/**
 * Reset chain state
 */
export const resetChain = () =>
	fimStore.setState((state) => ({
		...state,
		chainDepth: 0,
		lastAcceptPosition: null,
		prefetchedSuggestion: null,
		isPreFetching: false,
	}));

/**
 * Start pre-fetching next suggestion in chain
 */
export const startPreFetching = () =>
	fimStore.setState((state) => ({
		...state,
		isPreFetching: true,
	}));

/**
 * Set pre-fetched suggestion
 */
export const setPrefetchedSuggestion = (suggestion: string | null) =>
	fimStore.setState((state) => ({
		...state,
		prefetchedSuggestion: suggestion,
		isPreFetching: false,
	}));

// ============================================================================
// Hooks
// ============================================================================

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
		// Confidence actions
		setConfidence,
		setFIMMetrics,
		// Diff actions
		setDiffSuggestion,
		// Chain actions
		incrementChainDepth,
		resetChain,
		startPreFetching,
		setPrefetchedSuggestion,
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

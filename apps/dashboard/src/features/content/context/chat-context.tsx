import { Store, useStore } from "@tanstack/react-store";
import type { LexicalEditor } from "lexical";

export type ChatPhase = "idle" | "loading" | "streaming" | "error";
export type ChatMode = "plan" | "writer";
export type ChatModel = "grok-4.1-fast" | "glm-4.7" | "mistral-small-creative";
export type ToolCallStatus = "pending" | "executing" | "completed" | "error";

export interface SelectionContext {
	text: string;
	contextBefore: string;
	contextAfter: string;
}

export interface ContentMetadata {
	title: string;
	description: string;
	slug: string;
	keywords?: string[];
	status: string;
}

export interface PlanStep {
	id: string;
	step: string;
	description?: string;
	toolsToUse?: string[];
	rationale?: string;
	status: "pending" | "approved" | "skipped" | "completed";
}

/**
 * Input for creating a plan step (from the createPlan tool)
 */
export interface PlanStepInput {
	id: string;
	title: string;
	description: string;
	toolsToUse?: string[];
	rationale?: string;
}

export interface EditSuggestion {
	original: string;
	suggested: string;
	location?: { start: number; end: number };
}

export interface ToolCall {
	id: string;
	name: string;
	args: Record<string, unknown>;
	status: ToolCallStatus;
	result?: unknown;
	error?: string;
}

/**
 * A streaming step represents one agent "thinking + tool calls" cycle
 */
export interface StreamingStep {
	id: string;
	stepIndex: number;
	content: string;
	toolCalls: ToolCall[];
	isComplete: boolean;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
	selectionContext?: SelectionContext;
	// Mode-specific data
	type?: "text" | "plan" | "edit-suggestion" | "tool-use";
	planSteps?: PlanStep[];
	editSuggestion?: EditSuggestion;
	toolCalls?: ToolCall[];
}

interface ChatState {
	phase: ChatPhase;
	mode: ChatMode;
	model: ChatModel;
	isOpen: boolean;
	sessionId: string | null;
	contentId: string | null;
	messages: ChatMessage[];
	currentStreamingMessage: string;
	selectionContext: SelectionContext | null;
	documentContent: string;
	contentMetadata: ContentMetadata | null;
	error: Error | null;
	// Active tool calls (for current streaming response)
	activeToolCalls: ToolCall[];
	executingStepIndex: number | null;
	// Streaming steps (for multi-step agent execution)
	streamingSteps: StreamingStep[];
	currentStepIndex: number;
	// Editor reference for tool execution
	editor: LexicalEditor | null;
}

const initialState: ChatState = {
	phase: "idle",
	mode: "plan",
	model: "grok-4.1-fast",
	isOpen: false,
	sessionId: null,
	contentId: null,
	messages: [],
	currentStreamingMessage: "",
	selectionContext: null,
	documentContent: "",
	contentMetadata: null,
	error: null,
	activeToolCalls: [],
	executingStepIndex: null,
	streamingSteps: [],
	currentStepIndex: 0,
	editor: null,
};

const chatStore = new Store<ChatState>(initialState);

/**
 * Open the chat sidebar
 */
export const openChatSidebar = () =>
	chatStore.setState((state) => ({
		...state,
		isOpen: true,
	}));

/**
 * Close the chat sidebar
 */
export const closeChatSidebar = () =>
	chatStore.setState((state) => ({
		...state,
		isOpen: false,
		selectionContext: null,
	}));

/**
 * Toggle the chat sidebar
 */
export const toggleChatSidebar = () =>
	chatStore.setState((state) => ({
		...state,
		isOpen: !state.isOpen,
		selectionContext: state.isOpen ? null : state.selectionContext,
	}));

/**
 * Initialize chat session
 */
export const initializeChatSession = (
	sessionId: string,
	contentId: string,
	messages: ChatMessage[] = [],
) =>
	chatStore.setState((state) => ({
		...state,
		sessionId,
		contentId,
		messages,
		phase: "idle",
		error: null,
	}));

/**
 * Set selection context (from Ctrl+L)
 */
export const setSelectionContext = (context: SelectionContext) =>
	chatStore.setState((state) => ({
		...state,
		selectionContext: context,
	}));

/**
 * Clear selection context
 */
export const clearSelectionContext = () =>
	chatStore.setState((state) => ({
		...state,
		selectionContext: null,
	}));

/**
 * Set messages (from loading)
 */
export const setMessages = (messages: ChatMessage[]) =>
	chatStore.setState((state) => ({
		...state,
		messages,
	}));

/**
 * Add a user message
 */
export const addUserMessage = (content: string) =>
	chatStore.setState((state) => {
		const newMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content,
			timestamp: Date.now(),
			selectionContext: state.selectionContext || undefined,
		};

		return {
			...state,
			messages: [...state.messages, newMessage],
			selectionContext: null, // Clear after sending
		};
	});

/**
 * Start streaming phase
 */
export const startStreaming = () =>
	chatStore.setState((state) => ({
		...state,
		phase: "streaming",
		currentStreamingMessage: "",
		error: null,
	}));

/**
 * Append content to streaming message
 */
export const appendStreamingContent = (chunk: string) =>
	chatStore.setState((state) => ({
		...state,
		currentStreamingMessage: state.currentStreamingMessage + chunk,
	}));

/**
 * Complete streaming and add assistant message
 */
export const completeStreaming = () =>
	chatStore.setState((state) => {
		const assistantMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: state.currentStreamingMessage,
			timestamp: Date.now(),
		};

		return {
			...state,
			phase: "idle",
			messages: [...state.messages, assistantMessage],
			currentStreamingMessage: "",
		};
	});

/**
 * Set loading phase
 */
export const setLoading = () =>
	chatStore.setState((state) => ({
		...state,
		phase: "loading",
		error: null,
	}));

/**
 * Set error state
 */
export const setChatError = (error: Error | null) =>
	chatStore.setState((state) => ({
		...state,
		error,
		phase: error ? "error" : state.phase,
		currentStreamingMessage: "",
	}));

/**
 * Clear all chat state (clear conversation)
 */
export const clearChat = () =>
	chatStore.setState((state) => ({
		...state,
		messages: [],
		currentStreamingMessage: "",
		selectionContext: null,
		phase: "idle",
		error: null,
	}));

/**
 * Update document content (called by ChatPlugin on editor changes)
 */
export const setDocumentContent = (content: string) =>
	chatStore.setState((state) => ({
		...state,
		documentContent: content,
	}));

/**
 * Update content metadata
 */
export const setContentMetadata = (metadata: ContentMetadata) =>
	chatStore.setState((state) => ({
		...state,
		contentMetadata: metadata,
	}));

/**
 * Reset chat state completely
 */
export const resetChatState = () =>
	chatStore.setState(() => ({
		...initialState,
	}));

/**
 * Set chat mode (chat, plan, agent)
 */
export const setChatMode = (mode: ChatMode) =>
	chatStore.setState((state) => ({
		...state,
		mode,
	}));

/**
 * Set chat model
 */
export const setChatModel = (model: ChatModel) =>
	chatStore.setState((state) => ({
		...state,
		model,
	}));

/**
 * Update a plan step status
 */
export const updatePlanStep = (
	messageId: string,
	stepId: string,
	status: PlanStep["status"],
) =>
	chatStore.setState((state) => ({
		...state,
		messages: state.messages.map((msg) =>
			msg.id === messageId && msg.planSteps
				? {
						...msg,
						planSteps: msg.planSteps.map((step) =>
							step.id === stepId ? { ...step, status } : step,
						),
					}
				: msg,
		),
	}));

/**
 * Add an assistant message with edit suggestion
 */
export const addEditSuggestionMessage = (editSuggestion: EditSuggestion) =>
	chatStore.setState((state) => {
		const newMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: "",
			timestamp: Date.now(),
			type: "edit-suggestion",
			editSuggestion,
		};

		return {
			...state,
			messages: [...state.messages, newMessage],
		};
	});

/**
 * Add an assistant message with plan steps
 */
export const addPlanMessage = (summary: string, steps: PlanStepInput[]) =>
	chatStore.setState((state) => {
		const planSteps: PlanStep[] = steps.map((step) => ({
			id: step.id,
			step: step.title,
			description: step.description,
			toolsToUse: step.toolsToUse,
			rationale: step.rationale,
			status: "pending" as const,
		}));

		const newMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: summary,
			timestamp: Date.now(),
			type: "plan",
			planSteps,
		};

		return {
			...state,
			messages: [...state.messages, newMessage],
		};
	});

/**
 * Add a tool call to the active list
 */
export const addToolCall = (toolCall: Omit<ToolCall, "status">) =>
	chatStore.setState((state) => ({
		...state,
		activeToolCalls: [
			...state.activeToolCalls,
			{ ...toolCall, status: "pending" as ToolCallStatus },
		],
	}));

/**
 * Update a tool call status
 */
export const updateToolCallStatus = (
	toolCallId: string,
	status: ToolCallStatus,
	result?: unknown,
	error?: string,
) =>
	chatStore.setState((state) => ({
		...state,
		activeToolCalls: state.activeToolCalls.map((tc) =>
			tc.id === toolCallId ? { ...tc, status, result, error } : tc,
		),
	}));

/**
 * Clear all active tool calls
 */
export const clearActiveToolCalls = () =>
	chatStore.setState((state) => ({
		...state,
		activeToolCalls: [],
	}));

/**
 * Complete streaming with tool calls and add assistant message
 */
export const completeStreamingWithToolCalls = () =>
	chatStore.setState((state) => {
		const assistantMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: state.currentStreamingMessage,
			timestamp: Date.now(),
			type: state.activeToolCalls.length > 0 ? "tool-use" : "text",
			toolCalls:
				state.activeToolCalls.length > 0
					? [...state.activeToolCalls]
					: undefined,
		};

		return {
			...state,
			phase: "idle",
			messages: [...state.messages, assistantMessage],
			currentStreamingMessage: "",
			activeToolCalls: [],
		};
	});

/**
 * Set executing step index (for plan mode)
 */
export const setExecutingStep = (index: number | null) =>
	chatStore.setState((state) => ({
		...state,
		executingStepIndex: index,
	}));

/**
 * Approve all pending steps in a plan message
 */
export const approveAllSteps = (messageId: string) =>
	chatStore.setState((state) => ({
		...state,
		messages: state.messages.map((msg) =>
			msg.id === messageId && msg.planSteps
				? {
						...msg,
						planSteps: msg.planSteps.map((step) =>
							step.status === "pending" ? { ...step, status: "approved" } : step,
						),
					}
				: msg,
		),
	}));

/**
 * Set the editor reference for tool execution
 */
export const setEditor = (editor: LexicalEditor | null) =>
	chatStore.setState((state) => ({
		...state,
		editor,
	}));

// =====================
// Streaming Step Actions
// =====================

/**
 * Start a new streaming step
 */
export const startNewStep = (stepIndex: number) =>
	chatStore.setState((state) => {
		const newStep: StreamingStep = {
			id: `step-${stepIndex}-${Date.now()}`,
			stepIndex,
			content: "",
			toolCalls: [],
			isComplete: false,
		};
		return {
			...state,
			streamingSteps: [...state.streamingSteps, newStep],
			currentStepIndex: stepIndex,
		};
	});

/**
 * Append text to current streaming step
 */
export const appendToCurrentStep = (text: string) =>
	chatStore.setState((state) => ({
		...state,
		streamingSteps: state.streamingSteps.map((step, idx) =>
			idx === state.streamingSteps.length - 1
				? { ...step, content: step.content + text }
				: step
		),
		// Also update currentStreamingMessage for backward compatibility
		currentStreamingMessage: state.currentStreamingMessage + text,
	}));

/**
 * Add a tool call to current streaming step
 */
export const addToolCallToCurrentStep = (toolCall: Omit<ToolCall, "status">) =>
	chatStore.setState((state) => ({
		...state,
		streamingSteps: state.streamingSteps.map((step, idx) =>
			idx === state.streamingSteps.length - 1
				? {
						...step,
						toolCalls: [
							...step.toolCalls,
							{ ...toolCall, status: "pending" as ToolCallStatus },
						],
					}
				: step
		),
		// Also add to activeToolCalls for backward compatibility
		activeToolCalls: [
			...state.activeToolCalls,
			{ ...toolCall, status: "pending" as ToolCallStatus },
		],
	}));

/**
 * Update a tool call status in the streaming steps
 */
export const updateToolCallInStep = (
	toolCallId: string,
	status: ToolCallStatus,
	result?: unknown,
	error?: string,
) =>
	chatStore.setState((state) => ({
		...state,
		streamingSteps: state.streamingSteps.map((step) => ({
			...step,
			toolCalls: step.toolCalls.map((tc) =>
				tc.id === toolCallId ? { ...tc, status, result, error } : tc
			),
		})),
		// Also update activeToolCalls for backward compatibility
		activeToolCalls: state.activeToolCalls.map((tc) =>
			tc.id === toolCallId ? { ...tc, status, result, error } : tc
		),
	}));

/**
 * Mark current step as complete
 */
export const completeCurrentStep = () =>
	chatStore.setState((state) => ({
		...state,
		streamingSteps: state.streamingSteps.map((step, idx) =>
			idx === state.streamingSteps.length - 1
				? { ...step, isComplete: true }
				: step
		),
	}));

/**
 * Finalize streaming - convert steps to messages
 */
export const finalizeStreaming = () =>
	chatStore.setState((state) => {
		// Convert completed streaming steps into proper messages
		const newMessages: ChatMessage[] = state.streamingSteps
			.filter((step) => step.isComplete && (step.content || step.toolCalls.length > 0))
			.map((step) => ({
				id: step.id,
				role: "assistant" as const,
				content: step.content,
				timestamp: Date.now(),
				type: step.toolCalls.length > 0 ? ("tool-use" as const) : ("text" as const),
				toolCalls: step.toolCalls.length > 0 ? step.toolCalls : undefined,
			}));

		return {
			...state,
			phase: "idle",
			messages: [...state.messages, ...newMessages],
			streamingSteps: [],
			currentStepIndex: 0,
			currentStreamingMessage: "",
			activeToolCalls: [],
		};
	});

/**
 * Start streaming with steps (reset steps)
 */
export const startStreamingWithSteps = () =>
	chatStore.setState((state) => ({
		...state,
		phase: "streaming",
		streamingSteps: [],
		currentStepIndex: 0,
		currentStreamingMessage: "",
		activeToolCalls: [],
		error: null,
	}));

/**
 * Hook to access chat state and actions
 */
export const useChatContext = () => {
	const state = useStore(chatStore);

	return {
		...state,
		openChatSidebar,
		closeChatSidebar,
		toggleChatSidebar,
		initializeChatSession,
		setSelectionContext,
		clearSelectionContext,
		setMessages,
		addUserMessage,
		startStreaming,
		appendStreamingContent,
		completeStreaming,
		setLoading,
		setChatError,
		clearChat,
		resetChatState,
		setDocumentContent,
		setContentMetadata,
		setChatMode,
		setChatModel,
		updatePlanStep,
		addEditSuggestionMessage,
		addPlanMessage,
		// Tool call actions
		addToolCall,
		updateToolCallStatus,
		clearActiveToolCalls,
		completeStreamingWithToolCalls,
		setExecutingStep,
		approveAllSteps,
		setEditor,
		// Streaming step actions
		startNewStep,
		appendToCurrentStep,
		addToolCallToCurrentStep,
		updateToolCallInStep,
		completeCurrentStep,
		finalizeStreaming,
		startStreamingWithSteps,
	};
};

/**
 * Hook to access just the chat state (for read-only consumers)
 */
export const useChatState = () => {
	return useStore(chatStore);
};

/**
 * Get current chat state synchronously (for use outside React)
 */
export const getChatState = () => chatStore.state;

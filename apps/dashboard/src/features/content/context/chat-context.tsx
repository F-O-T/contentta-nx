import { Store, useStore } from "@tanstack/react-store";

export type ChatPhase = "idle" | "loading" | "streaming" | "error";

export interface SelectionContext {
	text: string;
	contextBefore: string;
	contextAfter: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
	selectionContext?: SelectionContext;
}

interface ChatState {
	phase: ChatPhase;
	isOpen: boolean;
	sessionId: string | null;
	contentId: string | null;
	messages: ChatMessage[];
	currentStreamingMessage: string;
	selectionContext: SelectionContext | null;
	error: Error | null;
}

const initialState: ChatState = {
	phase: "idle",
	isOpen: false,
	sessionId: null,
	contentId: null,
	messages: [],
	currentStreamingMessage: "",
	selectionContext: null,
	error: null,
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
 * Reset chat state completely
 */
export const resetChatState = () =>
	chatStore.setState(() => ({
		...initialState,
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

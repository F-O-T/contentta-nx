import { useCallback, useRef, useState, useEffect } from "react";
import { clientEnv } from "@packages/environment/client";
import type { LexicalEditor } from "lexical";
import {
	executeEditorTool,
	type ToolCall,
	type ToolExecutionResult,
} from "../utils/editor-tool-executor";
import {
	executeFrontmatterTool,
	isFrontmatterTool,
} from "../utils/frontmatter-tool-executor";

export interface AgentChatRequest {
	sessionId: string;
	contentId: string;
	messages: Array<{ role: "user" | "assistant"; content: string }>;
	selectionContext?: {
		text: string;
		contextBefore?: string;
		contextAfter?: string;
	};
	documentContext?: string;
	mode?: "plan" | "writer";
	model?: string;
	maxTokens?: number;
	temperature?: number;
}

/**
 * Plan step from createPlan tool
 */
export interface PlanStepFromTool {
	id: string;
	title: string;
	description: string;
	toolsToUse?: string[];
	rationale?: string;
}

/**
 * Plan result from createPlan tool
 */
export interface CreatePlanResult {
	summary: string;
	steps: PlanStepFromTool[];
}

/**
 * Active tool call with execution status
 */
export interface ActiveToolCall extends ToolCall {
	status: "pending" | "executing" | "completed" | "error";
	result?: ToolExecutionResult;
	startedAt: number;
	completedAt?: number;
}

/**
 * Chunk types from the server stream
 */
type AgentChatChunk =
	| { type: "step_start"; stepIndex: number }
	| { type: "text"; text: string; stepIndex: number; done?: boolean }
	| { type: "tool_call_start"; toolCall: ToolCall; stepIndex: number }
	| { type: "tool_call_complete"; toolCallId: string; result: unknown; stepIndex: number }
	| { type: "step_complete"; stepIndex: number }
	| { type: "done" }
	| { type: "error"; error: string; stepIndex?: number };

export interface UseAgentChatOptions {
	editor?: LexicalEditor | null;
	onStepStart?: (stepIndex: number) => void;
	onChunk: (text: string, stepIndex: number) => void;
	onStepComplete?: (stepIndex: number) => void;
	onComplete: () => void;
	onError: (error: Error) => void;
	onToolCallStart?: (toolCall: ActiveToolCall, stepIndex: number) => void;
	onToolCallComplete?: (
		toolCall: ActiveToolCall,
		result: ToolExecutionResult,
		stepIndex: number,
	) => void;
	onPlanCreated?: (plan: CreatePlanResult) => void;
}

export function useAgentChat({
	editor,
	onStepStart,
	onChunk,
	onStepComplete,
	onComplete,
	onError,
	onToolCallStart,
	onToolCallComplete,
	onPlanCreated,
}: UseAgentChatOptions) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [activeToolCalls, setActiveToolCalls] = useState<ActiveToolCall[]>([]);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Use refs for callbacks to avoid recreating sendMessage
	const onStepStartRef = useRef(onStepStart);
	const onChunkRef = useRef(onChunk);
	const onStepCompleteRef = useRef(onStepComplete);
	const onCompleteRef = useRef(onComplete);
	const onErrorRef = useRef(onError);
	const onToolCallStartRef = useRef(onToolCallStart);
	const onToolCallCompleteRef = useRef(onToolCallComplete);
	const onPlanCreatedRef = useRef(onPlanCreated);
	const editorRef = useRef(editor);

	// Keep refs updated
	useEffect(() => {
		onStepStartRef.current = onStepStart;
		onChunkRef.current = onChunk;
		onStepCompleteRef.current = onStepComplete;
		onCompleteRef.current = onComplete;
		onErrorRef.current = onError;
		onToolCallStartRef.current = onToolCallStart;
		onToolCallCompleteRef.current = onToolCallComplete;
		onPlanCreatedRef.current = onPlanCreated;
		editorRef.current = editor;
	}, [onStepStart, onChunk, onStepComplete, onComplete, onError, onToolCallStart, onToolCallComplete, onPlanCreated, editor]);

	const cancelChat = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsLoading(false);
	}, []);

	const sendMessage = useCallback(
		async (request: AgentChatRequest) => {
			cancelChat();
			abortControllerRef.current = new AbortController();
			const signal = abortControllerRef.current.signal;

			setIsLoading(true);
			setError(null);
			setActiveToolCalls([]);
			let fullText = "";

			// Map to track tool calls by ID for real-time updates
			const toolCallMap = new Map<string, ActiveToolCall>();

			try {
				// Use native fetch for true streaming
				const response = await fetch(
					`${clientEnv.VITE_SERVER_URL}/api/agent/chat/stream`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify(request),
						signal,
					},
				);

				if (!response.ok) {
					throw new Error(`Agent chat request failed: ${response.status}`);
				}

				if (!response.body) {
					throw new Error("No response body");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						if (signal.aborted) break;

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split("\n");
						buffer = lines.pop() || "";

						for (const line of lines) {
							if (!line.trim()) continue;
							try {
								const chunk: AgentChatChunk = JSON.parse(line);

								if (chunk.type === "error") {
									throw new Error(chunk.error || "Unknown error");
								}

								if (chunk.type === "step_start") {
									// New step started
									onStepStartRef.current?.(chunk.stepIndex);
								}

								if (chunk.type === "text" && !chunk.done && chunk.text) {
									fullText += chunk.text;
									onChunkRef.current(chunk.text, chunk.stepIndex);
								}

								if (chunk.type === "tool_call_start") {
									// Tool call started - add to active tools immediately
									const activeToolCall: ActiveToolCall = {
										...chunk.toolCall,
										status: "pending",
										startedAt: Date.now(),
									};
									
									toolCallMap.set(chunk.toolCall.id, activeToolCall);
									setActiveToolCalls((prev) => [...prev, activeToolCall]);
									onToolCallStartRef.current?.(activeToolCall, chunk.stepIndex);
								}

								if (chunk.type === "tool_call_complete") {
									// Tool call completed - execute in editor and update status
									const toolCall = toolCallMap.get(chunk.toolCallId);
									if (toolCall) {
										// Check if this is the createPlan tool
										if (toolCall.name === "createPlan") {
											// Handle plan creation - don't execute, just notify
											const plan = chunk.result as CreatePlanResult;
											
											// Update tool status to completed
											toolCall.status = "completed";
											toolCall.result = {
												success: true,
												message: "Plan created",
												data: plan,
											};
											toolCall.completedAt = Date.now();

											setActiveToolCalls((prev) =>
												prev.map((tc) =>
													tc.id === chunk.toolCallId
														? {
																...tc,
																status: "completed" as const,
																result: toolCall.result,
																completedAt: Date.now(),
															}
														: tc
												)
											);

											// Notify that a plan was created
											onPlanCreatedRef.current?.(plan);
											
											// Skip normal tool execution
											continue;
										}

										// Update status to executing
										toolCall.status = "executing";
										setActiveToolCalls((prev) =>
											prev.map((tc) =>
												tc.id === chunk.toolCallId
													? { ...tc, status: "executing" as const }
													: tc
											)
										);

										// Execute the tool based on type
										let result: ToolExecutionResult = {
											success: true,
											message: "Tool executed on server",
											data: chunk.result,
										};

										if (isFrontmatterTool(toolCall.name)) {
											// Execute frontmatter tool
											result = await executeFrontmatterTool(toolCall);
										} else if (editorRef.current && isEditorTool(toolCall.name)) {
											// Execute editor tool
											result = await executeEditorTool(
												editorRef.current,
												toolCall,
											);
										}

										// Update to completed status
										toolCall.status = result.success ? "completed" : "error";
										toolCall.result = result;
										toolCall.completedAt = Date.now();

										setActiveToolCalls((prev) =>
											prev.map((tc) =>
												tc.id === chunk.toolCallId
													? {
															...tc,
															status: result.success ? "completed" : "error",
															result,
															completedAt: Date.now(),
														}
													: tc
											)
										);

										onToolCallCompleteRef.current?.(toolCall, result, chunk.stepIndex);
									}
								}

								if (chunk.type === "step_complete") {
									// Step finished
									onStepCompleteRef.current?.(chunk.stepIndex);
								}

								if (chunk.type === "done") {
									// All steps completed
									onCompleteRef.current();
								}
							} catch (parseError) {
								// Skip invalid JSON lines (not re-throwing parse errors)
								if (
									parseError instanceof SyntaxError ||
									(parseError as Error).name === "SyntaxError"
								) {
									continue;
								}
								throw parseError;
							}
						}
					}
				} finally {
					reader.releaseLock();
				}

				if (!signal.aborted) {
					onCompleteRef.current();
				}
			} catch (err) {
				if (!signal.aborted) {
					const error = err instanceof Error ? err : new Error(String(err));
					setError(error);
					onErrorRef.current(error);
				}
			} finally {
				setIsLoading(false);
				abortControllerRef.current = null;
			}
		},
		[cancelChat],
	);

	return { sendMessage, cancelChat, isLoading, error, activeToolCalls };
}

/**
 * Check if a tool is an editor tool that modifies the document
 */
function isEditorTool(toolName: string): boolean {
	const editorTools = [
		"insertText",
		"insertHeading",
		"insertList",
		"insertCodeBlock",
		"insertTable",
		"insertImage",
		"replaceText",
		"deleteText",
		"formatText",
	];
	return editorTools.includes(toolName);
}

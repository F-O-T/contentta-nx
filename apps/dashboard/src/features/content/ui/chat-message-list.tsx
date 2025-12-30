import { LogoIcon } from "@packages/ui/blocks/logo";
import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType, ToolCall, StreamingStep, PlanStep } from "../context/chat-context";
import { ChatMessage } from "./chat-message";
import { ChatPlanMessage } from "./chat-plan-message";
import { ChatEditSuggestion } from "./chat-edit-suggestion";
import { ChatToolCallList } from "./chat-tool-call";

interface ChatMessageListProps {
	messages: ChatMessageType[];
	streamingContent: string;
	isStreaming: boolean;
	activeToolCalls?: ToolCall[];
	streamingSteps?: StreamingStep[];
	onAcceptEdit?: (suggestion: NonNullable<ChatMessageType["editSuggestion"]>) => void;
	onExecutePlan?: (approvedSteps: PlanStep[], executionPrompt: string) => void;
}

function ChatMessageItem({
	message,
	onAcceptEdit,
	onExecutePlan,
}: {
	message: ChatMessageType;
	onAcceptEdit?: (suggestion: NonNullable<ChatMessageType["editSuggestion"]>) => void;
	onExecutePlan?: (approvedSteps: PlanStep[], executionPrompt: string) => void;
}) {
	if (message.type === "plan") {
		return <ChatPlanMessage message={message} onExecutePlan={onExecutePlan} />;
	}
	if (message.type === "edit-suggestion") {
		return <ChatEditSuggestion message={message} onAccept={onAcceptEdit} />;
	}
	return (
		<>
			<ChatMessage message={message} />
			{/* Show tool calls below the message if present (from history) */}
			{message.toolCalls && message.toolCalls.length > 0 && (
				<div className="py-2 ml-10">
					<ChatToolCallList toolCalls={message.toolCalls} />
				</div>
			)}
		</>
	);
}

export function ChatMessageList({
	messages,
	streamingContent,
	isStreaming,
	activeToolCalls,
	streamingSteps,
	onAcceptEdit,
	onExecutePlan,
}: ChatMessageListProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive or during streaming
	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length, streamingContent, activeToolCalls?.length, streamingSteps?.length]);

	if (messages.length === 0 && !isStreaming) {
		return (
			<div className="flex h-full flex-col items-center justify-center px-6 text-center">
				<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
					<LogoIcon className="size-6" />
				</div>
				<p className="text-sm font-medium text-foreground">
					Start a conversation
				</p>
				<p className="mt-1.5 text-xs text-muted-foreground max-w-[200px]">
					Ask questions about your content, get suggestions, or discuss ideas.
				</p>
			</div>
		);
	}

	return (
		<div ref={scrollRef} className="flex flex-col px-3">
			{messages.map((message) => (
				<ChatMessageItem
					key={message.id}
					message={message}
					onAcceptEdit={onAcceptEdit}
					onExecutePlan={onExecutePlan}
				/>
			))}

			{/* Streaming steps - each step is a separate message with tool calls */}
			{isStreaming && streamingSteps && streamingSteps.map((step) => (
				<div key={step.id}>
					{/* Step content as a message */}
					{step.content && (
						<ChatMessage
							message={{
								id: step.id,
								role: "assistant",
								content: step.content,
								timestamp: Date.now(),
							}}
							isStreaming={!step.isComplete && step.toolCalls.length === 0}
						/>
					)}
					{/* Tool calls for this step */}
					{step.toolCalls.length > 0 && (
						<div className="py-2 ml-10">
							<ChatToolCallList toolCalls={step.toolCalls} />
						</div>
					)}
				</div>
			))}

			{/* Fallback: Legacy streaming message (when no steps yet) */}
			{isStreaming && (!streamingSteps || streamingSteps.length === 0) && streamingContent && (
				<ChatMessage
					message={{
						id: "streaming",
						role: "assistant",
						content: streamingContent,
						timestamp: Date.now(),
					}}
					isStreaming
				/>
			)}

			{/* Legacy: Active tool calls without steps */}
			{isStreaming && (!streamingSteps || streamingSteps.length === 0) && activeToolCalls && activeToolCalls.length > 0 && (
				<div className="py-2">
					<ChatToolCallList toolCalls={activeToolCalls} />
				</div>
			)}

			{/* Invisible element for auto-scroll */}
			<div ref={bottomRef} />
		</div>
	);
}

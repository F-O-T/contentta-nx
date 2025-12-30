import { ScrollArea } from "@packages/ui/components/scroll-area";
import { cn } from "@packages/ui/lib/utils";
import { useEffect } from "react";
import { useChatSession } from "../hooks/use-chat-session";
import {
	useChatState,
	setContentMetadata,
	type ContentMetadata,
	type PlanStep,
} from "../context/chat-context";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { ChatSelectionContext } from "./chat-selection-context";

interface ChatSidebarProps {
	contentId: string;
	contentMeta?: ContentMetadata;
	className?: string;
}

export function ChatSidebar({
	contentId,
	contentMeta,
	className,
}: ChatSidebarProps) {
	const { selectionContext, documentContent, activeToolCalls, mode } =
		useChatState();

	const {
		messages,
		currentStreamingMessage,
		streamingSteps,
		isStreaming,
		sendMessage,
		cancelChat,
	} = useChatSession(contentId);

	// Update content metadata when prop changes
	useEffect(() => {
		if (contentMeta) {
			setContentMetadata(contentMeta);
		}
	}, [contentMeta]);

	const handleSend = (content: string) => {
		// Pass document content with the message
		sendMessage(content, documentContent);
	};

	const handleExecutePlan = (_approvedSteps: PlanStep[], executionPrompt: string) => {
		// Send the execution prompt to the agent in writer mode
		sendMessage(executionPrompt, documentContent);
	};

	return (
		<div
			className={cn(
				"flex h-full w-4/12 shrink-0 flex-col border-l bg-background overflow-hidden",
				className,
			)}
		>
			{/* Messages */}
			<ScrollArea className="flex-1 min-h-0 ">
				<ChatMessageList
					messages={messages}
					streamingContent={currentStreamingMessage}
					isStreaming={isStreaming}
					activeToolCalls={activeToolCalls}
					streamingSteps={streamingSteps}
					onExecutePlan={handleExecutePlan}
				/>
			</ScrollArea>

			{/* Selection Context */}
			{selectionContext && (
				<ChatSelectionContext context={selectionContext} />
			)}

			{/* Input Area */}
			<div className="shrink-0 border-t p-3">
				<ChatInput
					onSend={handleSend}
					onCancel={cancelChat}
					isLoading={isStreaming}
					placeholder={
						mode === "plan"
							? "What would you like to plan?"
							: "What should I write or edit?"
					}
				/>
			</div>
		</div>
	);
}

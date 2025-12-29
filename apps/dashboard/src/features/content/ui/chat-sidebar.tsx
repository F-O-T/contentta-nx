import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { cn } from "@packages/ui/lib/utils";
import { MessageSquare, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useChatSession } from "../hooks/use-chat-session";
import {
	useChatState,
	setContentMetadata,
	type ContentMetadata,
} from "../context/chat-context";
import { ChatInput } from "./chat-input";
import { ChatKeyboardHints } from "./chat-keyboard-hints";
import { ChatMessageList } from "./chat-message-list";
import { ChatSelectionContext } from "./chat-selection-context";
import { ChatModeToggle } from "./chat-mode-toggle";

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
	const { selectionContext, documentContent, contentMetadata } = useChatState();

	const {
		messages,
		currentStreamingMessage,
		isStreaming,
		sendMessage,
		cancelChat,
		clearConversation,
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

	// Build context summary for display
	const contextSummary = contentMetadata
		? `Writing: "${contentMetadata.title}"`
		: null;

	return (
		<div
			className={cn(
				"flex h-full w-80 shrink-0 flex-col border-l bg-background overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div className="flex shrink-0 flex-col border-b px-3 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MessageSquare className="size-4 text-primary" />
						<span className="text-sm font-medium">AI Assistant</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={clearConversation}
						title="Clear conversation"
						disabled={messages.length === 0 || isStreaming}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
				{contextSummary && (
					<p className="text-xs text-muted-foreground mt-1 truncate">
						{contextSummary}
					</p>
				)}
			</div>

			{/* Mode Toggle */}
			<div className="shrink-0 border-b px-3 py-2">
				<ChatModeToggle />
			</div>

			{/* Messages */}
			<ScrollArea className="flex-1 min-h-0 px-3">
				<ChatMessageList
					messages={messages}
					streamingContent={currentStreamingMessage}
					isStreaming={isStreaming}
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
					placeholder="Ask about your content..."
				/>
				<ChatKeyboardHints className="mt-2" />
			</div>
		</div>
	);
}

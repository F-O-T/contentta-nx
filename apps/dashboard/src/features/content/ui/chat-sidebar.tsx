import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { cn } from "@packages/ui/lib/utils";
import { MessageSquare, Trash2, X } from "lucide-react";
import { useChatSession } from "../hooks/use-chat-session";
import { closeChatSidebar, useChatState } from "../context/chat-context";
import { ChatInput } from "./chat-input";
import { ChatKeyboardHints } from "./chat-keyboard-hints";
import { ChatMessageList } from "./chat-message-list";
import { ChatSelectionContext } from "./chat-selection-context";

interface ChatSidebarProps {
	contentId: string;
	className?: string;
}

const SIDEBAR_WIDTH = "20rem"; // 320px

export function ChatSidebar({ contentId, className }: ChatSidebarProps) {
	const { isOpen, selectionContext } = useChatState();

	const {
		messages,
		currentStreamingMessage,
		isStreaming,
		sendMessage,
		cancelChat,
		clearConversation,
	} = useChatSession(contentId);

	// Handle sending a message
	const handleSend = (content: string) => {
		sendMessage(content);
	};

	if (!isOpen) return null;

	return (
		<div
			className={cn(
				"fixed right-0 top-0 z-40 flex h-full flex-col border-l bg-background shadow-lg",
				"animate-in slide-in-from-right duration-200",
				className,
			)}
			style={{ width: SIDEBAR_WIDTH }}
		>
			{/* Header */}
			<div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
				<div className="flex items-center gap-2">
					<MessageSquare className="size-4 text-primary" />
					<span className="text-sm font-medium">AI Assistant</span>
				</div>
				<div className="flex items-center gap-1">
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
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() => closeChatSidebar()}
						title="Close sidebar"
					>
						<X className="size-4" />
					</Button>
				</div>
			</div>

			{/* Messages */}
			<ScrollArea className="flex-1 px-3">
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

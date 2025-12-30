import { cn } from "@packages/ui/lib/utils";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "../context/chat-context";
import { ChatToolCallList } from "./chat-tool-call";
import { ChatMarkdown } from "./chat-markdown";

interface ChatMessageProps {
	message: ChatMessageType;
	isStreaming?: boolean;
}

export function ChatMessage({
	message,
	isStreaming = false,
}: ChatMessageProps) {
	const isUser = message.role === "user";
	const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;

	return (
		<div
			className={cn(
				"flex gap-3 py-3",
				isUser ? "flex-row-reverse" : "flex-row",
			)}
		>
			{/* Avatar */}
			<div
				className={cn(
					"flex size-7 shrink-0 items-center justify-center rounded-full",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				{isUser ? <User className="size-4" /> : <Bot className="size-4" />}
			</div>

			{/* Content */}
			<div
				className={cn(
					"flex flex-col gap-1 min-w-0 max-w-[85%]",
					isUser ? "items-end" : "items-start",
				)}
			>
				{/* Selection context badge */}
				{message.selectionContext && (
					<div className="mb-1 max-w-full rounded border bg-muted/50 px-2 py-1 text-xs text-muted-foreground overflow-hidden">
						<span className="font-medium">Selected: </span>
						<span className="line-clamp-2 italic break-words">
							{message.selectionContext.text.slice(0, 100)}
							{message.selectionContext.text.length > 100 && "..."}
						</span>
					</div>
				)}

				{/* Message content */}
				{(message.content || isStreaming) && (
					<div
						className={cn(
							"rounded-lg px-3 py-2 text-sm overflow-hidden",
							isUser
								? "bg-primary text-primary-foreground"
								: "bg-muted text-foreground",
							isStreaming && !isUser && "animate-pulse",
						)}
					>
						{isUser ? (
							<div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
								{message.content}
							</div>
						) : (
							<div className="overflow-x-auto">
								<ChatMarkdown
									content={message.content || (isStreaming ? "..." : "")}
								/>
							</div>
						)}
					</div>
				)}

				{/* Tool calls */}
				{hasToolCalls && (
					<div className="mt-2 w-full">
						<ChatToolCallList toolCalls={message.toolCalls!} />
					</div>
				)}

				{/* Timestamp */}
				<span className="text-[10px] text-muted-foreground">
					{formatTime(message.timestamp)}
				</span>
			</div>
		</div>
	);
}

function formatTime(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

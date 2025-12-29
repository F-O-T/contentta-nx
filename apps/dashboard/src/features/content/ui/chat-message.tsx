import { cn } from "@packages/ui/lib/utils";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "../context/chat-context";

interface ChatMessageProps {
	message: ChatMessageType;
	isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
	const isUser = message.role === "user";

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
				{isUser ? (
					<User className="size-4" />
				) : (
					<Bot className="size-4" />
				)}
			</div>

			{/* Content */}
			<div
				className={cn(
					"flex max-w-[85%] flex-col gap-1",
					isUser ? "items-end" : "items-start",
				)}
			>
				{/* Selection context badge */}
				{message.selectionContext && (
					<div className="mb-1 max-w-full rounded border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
						<span className="font-medium">Selected: </span>
						<span className="line-clamp-2 italic">
							{message.selectionContext.text.slice(0, 100)}
							{message.selectionContext.text.length > 100 && "..."}
						</span>
					</div>
				)}

				{/* Message content */}
				<div
					className={cn(
						"rounded-lg px-3 py-2 text-sm",
						isUser
							? "bg-primary text-primary-foreground"
							: "bg-muted text-foreground",
						isStreaming && !isUser && "animate-pulse",
					)}
				>
					<div className="whitespace-pre-wrap break-words">
						{message.content || (isStreaming ? "..." : "")}
					</div>
				</div>

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

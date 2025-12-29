import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "../context/chat-context";
import { ChatMessage } from "./chat-message";

interface ChatMessageListProps {
	messages: ChatMessageType[];
	streamingContent: string;
	isStreaming: boolean;
}

export function ChatMessageList({
	messages,
	streamingContent,
	isStreaming,
}: ChatMessageListProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive or during streaming
	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length, streamingContent]);

	if (messages.length === 0 && !isStreaming) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
				<div className="mb-2 text-2xl">💬</div>
				<p className="text-sm font-medium text-foreground">
					Start a conversation
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Ask questions about your content, get suggestions, or discuss ideas.
				</p>
				<p className="mt-3 text-xs text-muted-foreground">
					<kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
						Ctrl+L
					</kbd>{" "}
					to send selected text
				</p>
			</div>
		);
	}

	return (
		<div ref={scrollRef} className="flex flex-col">
			{messages.map((message) => (
				<ChatMessage key={message.id} message={message} />
			))}

			{/* Streaming message placeholder */}
			{isStreaming && streamingContent && (
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

			{/* Invisible element for auto-scroll */}
			<div ref={bottomRef} />
		</div>
	);
}

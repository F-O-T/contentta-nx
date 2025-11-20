"use client";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn } from "@/lib/utils";
import { Icons } from "@/ui/icons";

const chatVariants = cva(
	[
		"relative border border-border bg-card",
		"rounded-lg shadow-md transition-all duration-200 ease-in-out",
		"not-prose overflow-hidden",
	],
	{
		variants: {
			variant: {
				default: "",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const messageVariants = cva(
	[
		"w-fit max-w-[80%] rounded-lg px-3 py-2 text-sm",
		"not-prose transition-all duration-200 ease-in-out",
		"overflow-hidden",
	],
	{
		variants: {
			variant: {
				user: "bg-primary text-primary-foreground",
				assistant: "bg-muted text-muted-foreground",
				system: "mx-auto bg-muted text-center text-xs text-muted-foreground",
			},
		},
		defaultVariants: {
			variant: "user",
		},
	},
);

const inputVariants = cva(
	[
		"min-h-[40px] flex-1 resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 ease-in-out",
		"focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none",
		"disabled:cursor-not-allowed disabled:opacity-50",
		"not-prose placeholder:text-muted-foreground",
	],
	{
		variants: {
			variant: {
				default: ["border-input", "bg-background", "text-foreground"],
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface Message {
	id: string;
	content: string;
	sender: "user" | "assistant" | "system";
	timestamp: Date;
	avatar?: string;
	name?: string;
}

export interface TypingUser {
	id: string;
	name?: string;
	avatar?: string;
}

export interface ChatProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof chatVariants> {
	messages?: Message[];
	onSendMessage?: (message: string) => void;
	placeholder?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	maxLength?: number;
	showTimestamps?: boolean;
	showAvatars?: boolean;
	allowMultiline?: boolean;
	typingUsers?: TypingUser[];
	typingText?: string;
	enableTypewriter?: boolean;
	typewriterSpeed?: number;
}

export interface ChatMessagesProps
	extends React.HTMLAttributes<HTMLDivElement> {
	messages: Message[];
	showTimestamps?: boolean;
	showAvatars?: boolean;
	typingUsers?: TypingUser[];
	typingText?: string;
	enableTypewriter?: boolean;
	typewriterSpeed?: number;
}

export interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
	message: Message;
	showTimestamp?: boolean;
	showAvatar?: boolean;
	enableTypewriter?: boolean;
	typewriterSpeed?: number;
}

export interface TypingIndicatorProps
	extends React.HTMLAttributes<HTMLDivElement> {
	typingUsers: TypingUser[];
	typingText?: string;
	showAvatars?: boolean;
}

export interface ChatInputProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSendMessage"> {
	onSendMessage: (message: string) => void;
	placeholder?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	maxLength?: number;
	allowMultiline?: boolean;
}

export interface ChatActionsProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
	(
		{
			typingUsers,
			typingText = "is typing...",
			showAvatars = false,
			className,
			...props
		},
		ref,
	) => {
		if (!typingUsers || typingUsers.length === 0) return null;

		const getTypingText = () => {
			if (typingUsers.length === 1) {
				return `${typingUsers[0].name || "Someone"} ${typingText}`;
			}
			if (typingUsers.length === 2) {
				return `${typingUsers[0].name || "Someone"} and ${typingUsers[1].name || "someone else"} ${typingText}`;
			}
			return `${typingUsers[0].name || "Someone"} and ${typingUsers.length - 1} others ${typingText}`;
		};

		return (
			// biome-ignore lint/a11y/useSemanticElements: <dont>
			<div
				ref={ref}
				role="status"
				aria-label="Typing indicator"
				className={cn("not-prose flex items-end gap-2", className)}
				{...props}
			>
				{showAvatars && (
					<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
						{typingUsers[0].avatar ? (
							<img
								src={typingUsers[0].avatar}
								alt={typingUsers[0].name || "typing"}
								className="h-full w-full rounded-full object-cover"
							/>
						) : (
							<span>
								{typingUsers[0].name
									? typingUsers[0].name.charAt(0).toUpperCase()
									: "?"}
							</span>
						)}
					</div>
				)}

				<div className="flex w-full flex-col items-start gap-1">
					<div className="not-prose w-fit max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground transition-all duration-200 ease-in-out shadow-sm">
						<div className="flex items-center gap-2">
							<span className="text-xs italic">{getTypingText()}</span>
							<div className="flex gap-1 ml-2">
								<div className="h-2 w-2 animate-pulse rounded-full bg-foreground/60 [animation-delay:-0.4s]" />
								<div className="h-2 w-2 animate-pulse rounded-full bg-foreground/60 [animation-delay:-0.2s]" />
								<div className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
);
TypingIndicator.displayName = "TypingIndicator";

const Chat = React.forwardRef<HTMLDivElement, ChatProps>(
	(
		{
			messages = [],
			onSendMessage,
			placeholder = "Type a message...",
			disabled = false,
			autoFocus = false,
			maxLength = 500,
			showTimestamps = false,
			showAvatars = false,
			allowMultiline = true,
			typingUsers = [],
			typingText,
			enableTypewriter = false,
			typewriterSpeed = 30,
			variant,
			className,
			...props
		},
		ref,
	) => {
		return (
			<div
				ref={ref}
				className={cn(chatVariants({ variant }), className)}
				{...props}
			>
				<div className="flex h-full flex-col rounded-lg">
					<ChatMessages
						messages={messages}
						showTimestamps={showTimestamps}
						showAvatars={showAvatars}
						typingUsers={typingUsers}
						typingText={typingText}
						enableTypewriter={enableTypewriter}
						typewriterSpeed={typewriterSpeed}
						className="max-h-96 min-h-0 flex-1"
					/>
					{onSendMessage && (
						<ChatInput
							onSendMessage={onSendMessage}
							placeholder={placeholder}
							disabled={disabled}
							autoFocus={autoFocus}
							maxLength={maxLength}
							allowMultiline={allowMultiline}
						/>
					)}
				</div>
			</div>
		);
	},
);
Chat.displayName = "Chat";

const ChatMessages = React.forwardRef<HTMLDivElement, ChatMessagesProps>(
	({
		messages,
		showTimestamps = false,
		showAvatars = false,
		typingUsers = [],
		typingText,
		enableTypewriter = false,
		typewriterSpeed = 30,
		className,
		...props
	}) => {
		const messagesEndRef = React.useRef<HTMLDivElement>(null);
		const containerRef = React.useRef<HTMLDivElement>(null);

		// biome-ignore lint/correctness/useExhaustiveDependencies: <the array is nescessary>
		React.useEffect(() => {
			if (containerRef.current && messagesEndRef.current) {
				const container = containerRef.current;
				const scrollHeight = container.scrollHeight;
				const height = container.clientHeight;
				const maxScrollTop = scrollHeight - height;

				container.scrollTo({
					top: maxScrollTop > 0 ? maxScrollTop : 0,
					behavior: "smooth",
				});
			}
		}, [messages.length, typingUsers.length]);

		return (
			<div
				ref={containerRef}
				role="log"
				aria-live="polite"
				aria-relevant="additions text"
				aria-label="Chat messages"
				className={cn(
					"not-prose flex-1 space-y-3 overflow-y-auto p-4",
					className,
				)}
				{...props}
			>
				{messages.map((message) => (
					<ChatMessage
						key={message.id}
						message={message}
						showTimestamp={showTimestamps}
						showAvatar={showAvatars}
						enableTypewriter={enableTypewriter}
						typewriterSpeed={typewriterSpeed}
					/>
				))}
				<TypingIndicator
					typingUsers={typingUsers}
					typingText={typingText}
					showAvatars={showAvatars}
				/>
				<div ref={messagesEndRef} />
			</div>
		);
	},
);
ChatMessages.displayName = "ChatMessages";

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
	(
		{
			message,
			showTimestamp = false,
			showAvatar = false,
			enableTypewriter = false,
			typewriterSpeed = 30,
			className,
			...props
		},
		ref,
	) => {
		const isUser = message.sender === "user";
		const isSystem = message.sender === "system";
		const isAssistant = message.sender === "assistant";

		const shouldTypewrite = enableTypewriter && isAssistant;
		const { displayed, typing } = useTypewriter(message.content, {
			speed: typewriterSpeed,
			enabled: shouldTypewrite,
		});

		const displayContent = shouldTypewrite ? displayed : message.content;

		return (
			<div
				ref={ref}
				role={isSystem ? "status" : "listitem"}
				className={cn(
					"not-prose flex items-end gap-2",
					isUser ? "flex-row-reverse" : "flex-row",
					isSystem ? "justify-center" : "",
					className,
				)}
				{...props}
			>
				{showAvatar && !isSystem && (
					<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
						{message.avatar ? (
							<img
								src={message.avatar}
								alt={message.name || message.sender}
								className="h-full w-full rounded-full object-cover"
							/>
						) : (
							<span>
								{message.name
									? message.name.charAt(0).toUpperCase()
									: message.sender.charAt(0).toUpperCase()}
							</span>
						)}
					</div>
				)}

				<div
					className={cn(
						"flex w-full flex-col gap-1",
						isUser ? "items-end" : "items-start",
						isSystem ? "items-center" : "",
					)}
				>
					<div className={cn(messageVariants({ variant: message.sender }))}>
						<div className="flex w-full flex-col gap-1">
							<div className="whitespace-pre-wrap">
								{displayContent}
								{typing && (
									<span className="ml-1 inline-block animate-pulse">▋</span>
								)}
							</div>
							{showTimestamp && (
								<span
									className={cn(
										"text-xs opacity-70",
										isUser ? "text-right" : "text-left",
										isSystem ? "text-center" : "",
									)}
								>
									{message.timestamp.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	},
);
ChatMessage.displayName = "ChatMessage";

const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
	(
		{
			onSendMessage,
			placeholder = "Type a message...",
			disabled = false,
			autoFocus = false,
			maxLength = 500,
			allowMultiline = true,
			className,
			...props
		},
		ref,
	) => {
		const [message, setMessage] = React.useState("");
		const textareaRef = React.useRef<HTMLTextAreaElement>(null);

		React.useEffect(() => {
			if (autoFocus && textareaRef.current) {
				textareaRef.current.focus({ preventScroll: true });
			}
		}, [autoFocus]);

		const handleSubmit = React.useCallback(
			(e: React.FormEvent) => {
				e.preventDefault();
				if (message.trim() && !disabled) {
					onSendMessage(message.trim());
					setMessage("");
					if (textareaRef.current) {
						textareaRef.current.style.height = "auto";
					}
				}
			},
			[message, disabled, onSendMessage],
		);

		const handleKeyDown = React.useCallback(
			(e: React.KeyboardEvent) => {
				if (e.key === "Enter") {
					if (allowMultiline && e.shiftKey) {
						return;
					}
					e.preventDefault();
					handleSubmit(e);
				}
			},
			[allowMultiline, handleSubmit],
		);

		const handleTextareaChange = React.useCallback(
			(e: React.ChangeEvent<HTMLTextAreaElement>) => {
				const value = e.target.value;
				if (maxLength && value.length > maxLength) return;

				setMessage(value);

				if (textareaRef.current) {
					textareaRef.current.style.height = "auto";
					const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
					textareaRef.current.style.height = `${newHeight}px`;
				}
			},
			[maxLength],
		);

		return (
			<div
				ref={ref}
				className={cn(
					"not-prose border-t border-border bg-muted/30 p-4",
					className,
				)}
				{...props}
			>
				<form onSubmit={handleSubmit} className="flex items-center gap-2">
					<textarea
						ref={textareaRef}
						value={message}
						onChange={handleTextareaChange}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						aria-label={placeholder || "Type a message"}
						aria-multiline={allowMultiline}
						disabled={disabled}
						rows={1}
						className={inputVariants({ variant: "default" })}
					/>
					<button
						type="submit"
						aria-label="Send message"
						disabled={!message.trim() || disabled}
						className={cn(
							"relative h-full rounded-md px-3 py-2 font-medium transition-all duration-200 ease-in-out",
							"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
							"not-prose disabled:cursor-not-allowed disabled:opacity-50",
							"bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm",
						)}
					>
						<Icons.SendMessage
							aria-hidden="true"
							className="mb-0.5 ml-1 size-5 -rotate-45"
						/>
					</button>
				</form>
				{maxLength && (
					<div className="flex mt-1 justify-between items-center text-xs text-muted-foreground">
						<span className="gap-1 flex">
							Powered by
							<a
								href="https://contentagen.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground/60 hover:text-foreground/80 underline transition-colors"
							>
								ContentaGen
							</a>
						</span>
						<div>
							{message.length}/{maxLength}
						</div>
					</div>
				)}
			</div>
		);
	},
);
ChatInput.displayName = "ChatInput";

const ChatActions = React.forwardRef<HTMLDivElement, ChatActionsProps>(
	({ children, className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn("not-prose flex items-center gap-2", className)}
				{...props}
			>
				{children}
			</div>
		);
	},
);
ChatActions.displayName = "ChatActions";

export {
	Chat,
	ChatMessages,
	ChatMessage,
	ChatInput,
	ChatActions,
	TypingIndicator,
	chatVariants,
	messageVariants,
	inputVariants,
};

"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, getLocaleStrings, type Locale } from "@/lib/locale";
import { Chat, type Message, type TypingUser } from "@/ui/chat";

export interface ContentaChatProps {
	sendMessage: (message: string) => Promise<string>;
	locale?: Locale;
	typingText?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	maxLength?: number;
	showTimestamps?: boolean;
	showAvatars?: boolean;
	allowMultiline?: boolean;
	className?: string;
	enableTypewriter?: boolean;
	typewriterSpeed?: number;
}

export const ContentaChat: React.FC<ContentaChatProps> = ({
	sendMessage,
	locale = DEFAULT_LOCALE,
	typingText,
	disabled = false,
	autoFocus = false,
	maxLength = 500,
	showTimestamps = true,
	showAvatars = false,
	allowMultiline = true,
	className = "max-w-md",
	enableTypewriter = true,
	typewriterSpeed = 30,
}) => {
	const localeStrings = useMemo(() => getLocaleStrings(locale), [locale]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

	const finalTypingText = useMemo(
		() => typingText ?? localeStrings.typingText,
		[typingText, localeStrings],
	);
	useEffect(() => {
		setTypingUsers([{ id: "assistant", name: localeStrings.assistantName }]);

		const timer = setTimeout(() => {
			const welcomeMsg: Message = {
				id: `assistant-welcome-${Date.now()}`,
				content: localeStrings.welcomeMessage,
				sender: "assistant",
				timestamp: new Date(),
			};
			setMessages([welcomeMsg]);
			setTypingUsers([]);
		}, 2500);

		return () => clearTimeout(timer);
	}, [localeStrings]);

	const createMessage = useCallback(
		(content: string, sender: "user" | "assistant" | "system"): Message => ({
			id: `${sender}-${Date.now()}`,
			content,
			sender,
			name: sender === "assistant" ? localeStrings.assistantName : undefined,
			timestamp: new Date(),
		}),
		[localeStrings.assistantName],
	);

	const handleSendMessage = useCallback(
		async (userMessage: string) => {
			if (!userMessage.trim() || isLoading) return;

			setMessages((prev) => [...prev, createMessage(userMessage, "user")]);

			setIsLoading(true);
			setTypingUsers([{ id: "assistant", name: localeStrings.assistantName }]);

			try {
				const response = await sendMessage(userMessage);

				setMessages((prev) => [...prev, createMessage(response, "assistant")]);
			} catch (error) {
				console.error("Error sending message:", error);
				setMessages((prev) => [
					...prev,
					createMessage(localeStrings.errorMessage, "system"),
				]);
			} finally {
				setIsLoading(false);
				setTypingUsers([]);
			}
		},
		[isLoading, sendMessage, localeStrings, createMessage],
	);

	const chatProps = useMemo(
		() => ({
			messages,
			onSendMessage: handleSendMessage,
			placeholder: localeStrings.placeholder,
			disabled: disabled || isLoading,
			autoFocus,
			maxLength,
			showTimestamps,
			showAvatars,
			allowMultiline,
			typingUsers,
			typingText: finalTypingText,
			className,
			enableTypewriter,
			typewriterSpeed,
		}),
		[
			messages,
			handleSendMessage,
			localeStrings.placeholder,
			disabled,
			isLoading,
			autoFocus,
			maxLength,
			showTimestamps,
			showAvatars,
			allowMultiline,
			typingUsers,
			finalTypingText,
			className,
			enableTypewriter,
			typewriterSpeed,
		],
	);

	return <Chat {...chatProps} />;
};

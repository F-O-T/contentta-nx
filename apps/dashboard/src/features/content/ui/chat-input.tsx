import { Button } from "@packages/ui/components/button";
import { Textarea } from "@packages/ui/components/textarea";
import { Send, Square } from "lucide-react";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import {
	useCommandParser,
	replaceCommand,
} from "../hooks/use-command-parser";
import {
	useChatCommands,
	type SlashCommand,
	type MentionCommand,
	type ChatCommand,
} from "../hooks/use-chat-commands";
import {
	ChatCommandSuggestions,
	type ChatCommandSuggestionsRef,
} from "./chat-command-suggestions";

interface ChatInputProps {
	onSend: (message: string) => void;
	onCancel?: () => void;
	isLoading?: boolean;
	disabled?: boolean;
	placeholder?: string;
}

export function ChatInput({
	onSend,
	onCancel,
	isLoading = false,
	disabled = false,
	placeholder = "Type a message...",
}: ChatInputProps) {
	const [value, setValue] = useState("");
	const [cursorPosition, setCursorPosition] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const suggestionsRef = useRef<ChatCommandSuggestionsRef>(null);

	// Parse for commands
	const commandMatch = useCommandParser(value, cursorPosition);

	// Get available commands
	const { slashCommands, mentionCommands, filterCommands } = useChatCommands(onSend);

	const handleSubmit = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed || isLoading || disabled) return;

		onSend(trimmed);
		setValue("");
		setCursorPosition(0);

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	}, [value, isLoading, disabled, onSend]);

	const handleCommandSelect = useCallback(
		(command: ChatCommand) => {
			if (!commandMatch) return;

			if (commandMatch.type === "slash") {
				// Execute slash command and clear input
				(command as SlashCommand).handler();
				const newValue = replaceCommand(value, commandMatch, "");
				setValue(newValue);
				setCursorPosition(commandMatch.startIndex);
			} else {
				// Insert mention value
				const mentionValue = (command as MentionCommand).getValue();
				const newValue = replaceCommand(value, commandMatch, mentionValue);
				setValue(newValue);
				setCursorPosition(commandMatch.startIndex + mentionValue.length + 1);
			}

			// Focus textarea
			textareaRef.current?.focus();
		},
		[commandMatch, value],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			// Handle command suggestions navigation
			if (commandMatch) {
				if (e.key === "ArrowUp") {
					e.preventDefault();
					suggestionsRef.current?.moveUp();
					return;
				}
				if (e.key === "ArrowDown") {
					e.preventDefault();
					suggestionsRef.current?.moveDown();
					return;
				}
				if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
					e.preventDefault();
					suggestionsRef.current?.selectCurrent();
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					// Clear command by adding a space
					setValue(value + " ");
					setCursorPosition(cursorPosition + 1);
					return;
				}
			}

			// Enter to send (without shift)
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[commandMatch, handleSubmit, value, cursorPosition],
	);

	// Track cursor position
	const handleSelect = useCallback(() => {
		if (textareaRef.current) {
			setCursorPosition(textareaRef.current.selectionStart);
		}
	}, []);

	// Auto-resize textarea
	const handleInput = useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
	}, []);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setValue(e.target.value);
			setCursorPosition(e.target.selectionStart);
			handleInput();
		},
		[handleInput],
	);

	return (
		<div className="relative">
			{/* Command suggestions popover */}
			{commandMatch && (
				<ChatCommandSuggestions
					ref={suggestionsRef}
					type={commandMatch.type!}
					slashCommands={slashCommands}
					mentionCommands={mentionCommands}
					query={commandMatch.query}
					onSelect={handleCommandSelect}
					filterCommands={filterCommands}
				/>
			)}

			<div className="flex items-end gap-2">
				<Textarea
					ref={textareaRef}
					value={value}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					onSelect={handleSelect}
					onClick={handleSelect}
					placeholder={placeholder}
					disabled={disabled}
					className="min-h-[40px] max-h-[150px] resize-none text-sm"
					rows={1}
				/>

				{isLoading ? (
					<Button
						size="icon"
						variant="outline"
						onClick={onCancel}
						className="shrink-0"
						title="Stop generating"
					>
						<Square className="size-4" />
					</Button>
				) : (
					<Button
						size="icon"
						onClick={handleSubmit}
						disabled={!value.trim() || disabled}
						className="shrink-0"
						title="Send message"
					>
						<Send className="size-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

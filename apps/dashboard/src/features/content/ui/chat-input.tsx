import { Button } from "@packages/ui/components/button";
import { Textarea } from "@packages/ui/components/textarea";
import { Send, Square } from "lucide-react";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";

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
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed || isLoading || disabled) return;

		onSend(trimmed);
		setValue("");

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	}, [value, isLoading, disabled, onSend]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			// Enter to send (without shift)
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	// Auto-resize textarea
	const handleInput = useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
	}, []);

	return (
		<div className="flex items-end gap-2">
			<Textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => {
					setValue(e.target.value);
					handleInput();
				}}
				onKeyDown={handleKeyDown}
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
	);
}

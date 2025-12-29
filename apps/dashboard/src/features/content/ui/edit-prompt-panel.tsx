import { cn } from "@packages/ui/lib/utils";
import { Input } from "@packages/ui/components/input";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EditKeyboardHints } from "./edit-keyboard-hints";

interface EditPromptPanelProps {
	position: { top: number; left: number };
	onSubmit: (instruction: string) => void;
	onCancel: () => void;
	isStreaming: boolean;
	containerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Floating panel for entering edit instructions.
 * Appears above the selected text when Ctrl+K is pressed.
 */
export function EditPromptPanel({
	position,
	onSubmit,
	onCancel,
	isStreaming,
	containerRef,
}: EditPromptPanelProps) {
	const [instruction, setInstruction] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-focus on mount
	useEffect(() => {
		// Small delay to ensure DOM is ready
		const timer = setTimeout(() => {
			inputRef.current?.focus();
		}, 50);
		return () => clearTimeout(timer);
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			e.stopPropagation();
			if (instruction.trim() && !isStreaming) {
				onSubmit(instruction.trim());
			}
		}
		if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			onCancel();
		}
	};

	// Calculate max width based on container
	const containerWidth = containerRef?.current?.offsetWidth ?? 400;
	const maxWidth = Math.min(containerWidth - 32, 400);

	return (
		<div
			className={cn(
				"absolute z-50 rounded-lg border bg-popover/95 p-2 shadow-lg backdrop-blur-sm",
				"animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
				"duration-150",
			)}
			style={{
				top: position.top - 56, // Above the selection
				left: Math.max(16, position.left - 100), // Centered-ish on selection
				width: maxWidth,
			}}
		>
			<div className="flex items-center gap-2">
				<Sparkles className="h-4 w-4 shrink-0 text-primary" />
				<Input
					ref={inputRef}
					placeholder="Describe your edit..."
					value={instruction}
					onChange={(e) => setInstruction(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={isStreaming}
					className="h-8 flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
				/>
				{isStreaming && (
					<Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
				)}
			</div>

			{/* Separator */}
			<div className="my-1.5 border-t border-border/50" />

			{/* Keyboard hints */}
			<EditKeyboardHints />
		</div>
	);
}

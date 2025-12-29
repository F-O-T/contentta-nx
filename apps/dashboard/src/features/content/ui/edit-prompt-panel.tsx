import { cn } from "@packages/ui/lib/utils";
import { Input } from "@packages/ui/components/input";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface EditPromptPanelProps {
	position: { top: number; left: number };
	onSubmit: (instruction: string) => void;
	onCancel: () => void;
	isStreaming: boolean;
	containerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Floating panel for entering edit instructions.
 * Appears above the selected text when Ctrl+K is pressed or AI Edit is clicked.
 * Rendered in a portal to prevent z-index stacking context issues.
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

	// Calculate absolute position based on container
	const containerRect = containerRef?.current?.getBoundingClientRect();
	const absoluteTop = (containerRect?.top ?? 0) + position.top - 44;
	const absoluteLeft = (containerRect?.left ?? 0) + position.left;

	const panel = (
		<div
			className={cn(
				"fixed z-[9999] flex items-center gap-2 rounded-lg border bg-popover/95 p-1.5 shadow-lg backdrop-blur-sm",
				"animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
				"duration-150",
			)}
			style={{
				top: absoluteTop,
				left: absoluteLeft,
				transform: "translateX(-50%)",
				minWidth: 280,
				maxWidth: 400,
			}}
			onMouseDown={(e) => e.preventDefault()}
		>
			<Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
			<Input
				ref={inputRef}
				placeholder="What would you like to change?"
				value={instruction}
				onChange={(e) => setInstruction(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={isStreaming}
				className="h-7 flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
			/>
			{isStreaming ? (
				<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
			) : (
				<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
					<kbd className="rounded border bg-background px-1 py-0.5 font-mono">
						↵
					</kbd>
					<span className="hidden sm:inline">submit</span>
					<kbd className="ml-1 rounded border bg-background px-1 py-0.5 font-mono">
						esc
					</kbd>
				</div>
			)}
		</div>
	);

	return createPortal(panel, document.body);
}

import { cn } from "@packages/ui/lib/utils";
import { FIMKeyboardHints } from "./fim-keyboard-hints";

interface FIMFloatingPanelProps {
	suggestion: string;
	position: { top: number; left: number };
	isVisible: boolean;
	containerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Floating panel for displaying multi-line FIM suggestions.
 * Used in "Cursor Tab" mode for longer, more complex completions.
 *
 * Positioned below the cursor line, with proper bounds checking
 * to stay within the editor container.
 */
export function FIMFloatingPanel({
	suggestion,
	position,
	isVisible,
	containerRef,
}: FIMFloatingPanelProps) {
	if (!isVisible || !suggestion) return null;

	// Calculate max width based on container
	const containerWidth = containerRef?.current?.offsetWidth ?? 400;
	const maxWidth = Math.min(containerWidth - position.left - 16, 400);

	return (
		<div
			className={cn(
				"absolute z-50 max-w-md rounded-lg border bg-popover/95 p-3 shadow-lg backdrop-blur-sm",
				"animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
				"duration-150",
			)}
			style={{
				top: position.top + 24, // Below cursor line
				left: position.left,
				maxWidth: maxWidth > 200 ? maxWidth : undefined,
			}}
		>
			{/* Suggestion content */}
			<div className="mb-2 max-h-48 overflow-y-auto">
				<pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground/80">
					{suggestion}
				</pre>
			</div>

			{/* Separator */}
			<div className="my-2 border-t border-border/50" />

			{/* Keyboard hints */}
			<FIMKeyboardHints variant="panel" />
		</div>
	);
}

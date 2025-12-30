import type { FIMDiffSuggestion } from "../types/streaming-schemas";
import { cn } from "@packages/ui/lib/utils";
import { FIMKeyboardHints } from "./fim-keyboard-hints";

interface FIMDiffPanelProps {
	diff: FIMDiffSuggestion;
	position: { top: number; left: number };
	isVisible: boolean;
	containerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Side-by-side diff preview panel for replacement suggestions
 * Shows original text vs suggested replacement
 */
export function FIMDiffPanel({
	diff,
	position,
	isVisible,
	containerRef,
}: FIMDiffPanelProps) {
	if (!isVisible || diff.type !== "replace" || !diff.original) {
		return null;
	}

	const containerWidth = containerRef?.current?.offsetWidth ?? 400;
	const maxWidth = Math.min(containerWidth - position.left - 16, 500);

	return (
		<div
			className={cn(
				"absolute z-50 overflow-hidden rounded-lg border bg-popover/95 shadow-lg backdrop-blur-sm",
				"animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
				"duration-150",
			)}
			style={{
				top: position.top + 24,
				left: Math.max(8, position.left),
				maxWidth,
				minWidth: 280,
			}}
		>
			{/* Header */}
			<div className="border-b border-border/50 bg-muted/50 px-3 py-1.5">
				<span className="text-xs font-medium text-muted-foreground">
					Suggested replacement
				</span>
			</div>

			{/* Side-by-side diff view */}
			<div className="grid grid-cols-2 gap-0 divide-x divide-border/50">
				{/* Original (left) */}
				<div className="p-3">
					<div className="mb-1.5 flex items-center gap-1.5">
						<div className="h-2 w-2 rounded-full bg-red-500" />
						<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Original
						</span>
					</div>
					<div className="rounded-md bg-red-500/10 p-2">
						<span className="text-sm leading-relaxed text-red-600 line-through decoration-red-400/50 dark:text-red-400">
							{diff.original}
						</span>
					</div>
				</div>

				{/* Suggestion (right) */}
				<div className="p-3">
					<div className="mb-1.5 flex items-center gap-1.5">
						<div className="h-2 w-2 rounded-full bg-green-500" />
						<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Suggestion
						</span>
					</div>
					<div className="rounded-md bg-green-500/10 p-2">
						<span className="text-sm leading-relaxed text-green-600 dark:text-green-400">
							{diff.suggestion}
						</span>
					</div>
				</div>
			</div>

			{/* Keyboard hints footer */}
			<div className="border-t border-border/50 bg-muted/30 px-3 py-2">
				<FIMKeyboardHints variant="panel" />
			</div>
		</div>
	);
}

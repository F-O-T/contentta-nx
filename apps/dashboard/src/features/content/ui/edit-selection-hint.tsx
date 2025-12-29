import { cn } from "@packages/ui/lib/utils";
import { Sparkles } from "lucide-react";

interface EditSelectionHintProps {
	position: { top: number; left: number };
	isVisible: boolean;
}

/**
 * Small floating hint that appears when text is selected.
 * Shows the Ctrl+K shortcut to trigger AI edit.
 */
export function EditSelectionHint({
	position,
	isVisible,
}: EditSelectionHintProps) {
	if (!isVisible) return null;

	return (
		<div
			className={cn(
				"absolute z-40 flex items-center gap-1.5 rounded-md border bg-popover/95 px-2 py-1 shadow-md backdrop-blur-sm",
				"animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1",
				"duration-150",
			)}
			style={{
				top: position.top - 32,
				left: position.left,
			}}
		>
			<Sparkles className="h-3 w-3 text-primary" />
			<span className="text-xs text-muted-foreground">
				<kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
					Ctrl+K
				</kbd>
				<span className="ml-1">to edit</span>
			</span>
		</div>
	);
}

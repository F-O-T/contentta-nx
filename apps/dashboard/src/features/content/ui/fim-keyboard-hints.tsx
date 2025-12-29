import { cn } from "@packages/ui/lib/utils";

interface FIMKeyboardHintsProps {
	variant?: "inline" | "panel" | "status";
	className?: string;
	showTrigger?: boolean;
}

/**
 * Reusable keyboard hints component for FIM suggestions.
 * Shows Tab to accept, Esc to dismiss, and optionally Ctrl+Space to trigger.
 */
export function FIMKeyboardHints({
	variant = "status",
	className,
	showTrigger = false,
}: FIMKeyboardHintsProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 text-[11px] text-muted-foreground",
				className,
			)}
		>
			<kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
				Tab
			</kbd>
			<span>accept</span>

			<span className="mx-1 text-muted-foreground/40">|</span>

			<kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
				Esc
			</kbd>
			<span>dismiss</span>

			{(showTrigger || variant === "panel") && (
				<>
					<span className="mx-1 text-muted-foreground/40">|</span>
					<kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
						Ctrl+Space
					</kbd>
					<span>trigger</span>
				</>
			)}
		</div>
	);
}

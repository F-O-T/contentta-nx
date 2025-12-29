import { cn } from "@packages/ui/lib/utils";

interface EditKeyboardHintsProps {
	className?: string;
}

/**
 * Keyboard hints component for edit prompt.
 * Shows Enter to submit, Esc to cancel.
 */
export function EditKeyboardHints({ className }: EditKeyboardHintsProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 text-[11px] text-muted-foreground",
				className,
			)}
		>
			<kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
				Enter
			</kbd>
			<span>submit</span>

			<span className="mx-1 text-muted-foreground/40">|</span>

			<kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
				Esc
			</kbd>
			<span>cancel</span>
		</div>
	);
}

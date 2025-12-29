import { cn } from "@packages/ui/lib/utils";

interface ChatKeyboardHintsProps {
	className?: string;
}

export function ChatKeyboardHints({ className }: ChatKeyboardHintsProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 text-[10px] text-muted-foreground",
				className,
			)}
		>
			<span className="flex items-center gap-1">
				<kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
					Enter
				</kbd>
				<span>send</span>
			</span>
			<span className="flex items-center gap-1">
				<kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
					Shift+Enter
				</kbd>
				<span>newline</span>
			</span>
			<span className="flex items-center gap-1">
				<kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
					Ctrl+L
				</kbd>
				<span>selection</span>
			</span>
		</div>
	);
}

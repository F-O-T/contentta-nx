import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { createDiff } from "@packages/utils/diff";
import { Check, X, Pencil } from "lucide-react";
import { useMemo } from "react";
import type { ChatMessage } from "../context/chat-context";

interface ChatEditSuggestionProps {
	message: ChatMessage;
	onAccept?: (suggestion: NonNullable<ChatMessage["editSuggestion"]>) => void;
	onReject?: () => void;
	onEdit?: (suggestion: NonNullable<ChatMessage["editSuggestion"]>) => void;
}

export function ChatEditSuggestion({
	message,
	onAccept,
	onReject,
	onEdit,
}: ChatEditSuggestionProps) {
	const { editSuggestion } = message;

	const diff = useMemo(() => {
		if (!editSuggestion) return [];
		return createDiff(editSuggestion.original, editSuggestion.suggested);
	}, [editSuggestion]);

	if (!editSuggestion) {
		return null;
	}

	return (
		<div className="py-3">
			{/* Header */}
			<div className="flex items-center gap-2 mb-3">
				<div className="size-6 rounded-full bg-amber-500/10 flex items-center justify-center">
					<span className="text-xs">✨</span>
				</div>
				<span className="text-sm font-medium">Edit Suggestion</span>
			</div>

			{/* Diff View */}
			<div className="rounded-lg border bg-muted/30 overflow-hidden">
				{/* Side-by-side view */}
				<div className="grid grid-cols-2 divide-x divide-border">
					{/* Original */}
					<div className="p-3">
						<div className="mb-2 flex items-center gap-1.5">
							<div className="size-2 rounded-full bg-red-500" />
							<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
								Original
							</span>
						</div>
						<div className="rounded-md bg-red-500/10 p-2">
							<span className="text-sm leading-relaxed text-red-600 dark:text-red-400 whitespace-pre-wrap">
								{editSuggestion.original}
							</span>
						</div>
					</div>

					{/* Suggested */}
					<div className="p-3">
						<div className="mb-2 flex items-center gap-1.5">
							<div className="size-2 rounded-full bg-green-500" />
							<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
								Suggested
							</span>
						</div>
						<div className="rounded-md bg-green-500/10 p-2">
							<span className="text-sm leading-relaxed text-green-600 dark:text-green-400 whitespace-pre-wrap">
								{editSuggestion.suggested}
							</span>
						</div>
					</div>
				</div>

				{/* Inline diff view (optional, for longer text) */}
				{diff.length > 0 && (
					<div className="border-t p-3">
						<div className="mb-2">
							<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
								Changes
							</span>
						</div>
						<div className="rounded-md bg-background p-2 text-sm leading-relaxed">
							{diff.map(([op, text], index) => (
								<span
									key={`diff-${index + 1}`}
									className={cn(
										op === -1 &&
											"bg-red-500/20 text-red-600 dark:text-red-400 line-through",
										op === 1 &&
											"bg-green-500/20 text-green-600 dark:text-green-400",
									)}
								>
									{text}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2 mt-3">
				<Button
					size="sm"
					variant="default"
					className="h-7 text-xs"
					onClick={() => onAccept?.(editSuggestion)}
				>
					<Check className="size-3 mr-1" />
					Accept
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-xs"
					onClick={() => onEdit?.(editSuggestion)}
				>
					<Pencil className="size-3 mr-1" />
					Edit
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 text-xs text-muted-foreground"
					onClick={onReject}
				>
					<X className="size-3 mr-1" />
					Reject
				</Button>
			</div>
		</div>
	);
}

import { Button } from "@packages/ui/components/button";
import { X } from "lucide-react";
import type { SelectionContext } from "../context/chat-context";
import { clearSelectionContext } from "../context/chat-context";

interface ChatSelectionContextProps {
	context: SelectionContext;
}

export function ChatSelectionContext({ context }: ChatSelectionContextProps) {
	return (
		<div className="border-t bg-muted/30 p-3">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="mb-1 text-xs font-medium text-muted-foreground">
						Selected text will be included:
					</p>
					<p className="line-clamp-3 text-xs italic text-foreground">
						"{context.text.slice(0, 200)}
						{context.text.length > 200 && "..."}"
					</p>
				</div>
				<Button
					size="icon"
					variant="ghost"
					onClick={() => clearSelectionContext()}
					className="size-6 shrink-0"
					title="Clear selection"
				>
					<X className="size-3" />
				</Button>
			</div>
		</div>
	);
}

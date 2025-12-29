import { Loader2 } from "lucide-react";
import type { FIMMode } from "../context/fim-context";
import { FIMKeyboardHints } from "./fim-keyboard-hints";

interface FIMStatusLineProps {
	isLoading: boolean;
	hasSuggestion: boolean;
	mode?: FIMMode;
}

export function FIMStatusLine({
	isLoading,
	hasSuggestion,
	mode = "idle",
}: FIMStatusLineProps) {
	if (!isLoading && !hasSuggestion) return null;

	const modeLabel = mode === "copilot" ? "Copilot" : mode === "cursor-tab" ? "Tab" : null;

	return (
		<div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
			<div className="flex items-center gap-2">
				{isLoading && (
					<>
						<Loader2 className="h-3 w-3 animate-spin" />
						<span>Generating...</span>
					</>
				)}
				{!isLoading && hasSuggestion && (
					<div className="flex items-center gap-2">
						<span className="text-primary">Suggestion ready</span>
						{modeLabel && (
							<span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
								{modeLabel}
							</span>
						)}
					</div>
				)}
			</div>
			{hasSuggestion && <FIMKeyboardHints variant="status" />}
		</div>
	);
}

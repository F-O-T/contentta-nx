import { Loader2 } from "lucide-react";
import { cn } from "@packages/ui/lib/utils";
import type { FIMMode } from "../context/fim-context";
import { FIMKeyboardHints } from "./fim-keyboard-hints";

interface FIMStatusLineProps {
	isLoading: boolean;
	hasSuggestion: boolean;
	mode?: FIMMode;
	confidenceScore?: number | null;
	chainDepth?: number;
}

/**
 * Get display label for FIM mode
 */
function getModeLabel(mode: FIMMode): string | null {
	switch (mode) {
		case "copilot":
			return "Copilot";
		case "cursor-tab":
			return "Tab";
		case "diff":
			return "Replace";
		default:
			return null;
	}
}

/**
 * Get confidence display with color coding
 */
function getConfidenceDisplay(score: number | null | undefined): {
	label: string;
	className: string;
} | null {
	if (score === null || score === undefined) return null;

	const percentage = Math.round(score * 100);

	if (score >= 0.8) {
		return {
			label: `${percentage}%`,
			className: "bg-green-500/10 text-green-600 dark:text-green-400",
		};
	}
	if (score >= 0.6) {
		return {
			label: `${percentage}%`,
			className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
		};
	}
	return {
		label: `${percentage}%`,
		className: "bg-red-500/10 text-red-600 dark:text-red-400",
	};
}

export function FIMStatusLine({
	isLoading,
	hasSuggestion,
	mode = "idle",
	confidenceScore,
	chainDepth = 0,
}: FIMStatusLineProps) {
	if (!isLoading && !hasSuggestion) return null;

	const modeLabel = getModeLabel(mode);
	const confidenceDisplay = getConfidenceDisplay(confidenceScore);

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
						
						{/* Mode badge */}
						{modeLabel && (
							<span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
								{modeLabel}
							</span>
						)}
						
						{/* Confidence badge */}
						{confidenceDisplay && (
							<span
								className={cn(
									"rounded px-1.5 py-0.5 text-[10px] font-medium",
									confidenceDisplay.className,
								)}
							>
								{confidenceDisplay.label}
							</span>
						)}
						
						{/* Chain depth badge */}
						{chainDepth > 0 && (
							<span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
								Chain x{chainDepth}
							</span>
						)}
					</div>
				)}
			</div>
			{hasSuggestion && <FIMKeyboardHints variant="status" />}
		</div>
	);
}

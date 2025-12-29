import { cn } from "@packages/ui/lib/utils";
import { Keyboard, Power, PowerOff } from "lucide-react";
import type { VimMode } from "../context/vim-context";
import { getModeName } from "../context/vim-context";

interface VimStatusLineProps {
	enabled: boolean;
	mode: VimMode;
	pendingOperator: string | null;
	pendingCount: number | null;
	pendingMotion: string | null;
	currentRegister: string;
	statusMessage: string | null;
	statusMessageType: "info" | "error" | "warning";
	cursorLine: number;
	cursorColumn: number;
	onToggle: () => void;
}

/**
 * Get mode badge styling
 */
function getModeStyle(mode: VimMode): string {
	switch (mode) {
		case "normal":
			return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
		case "insert":
			return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
		case "visual":
		case "visual-line":
		case "visual-block":
			return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
		case "command":
			return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
		default:
			return "bg-muted text-muted-foreground";
	}
}

/**
 * Format pending state for display
 */
function formatPendingState(
	operator: string | null,
	count: number | null,
	motion: string | null,
	register: string,
): string | null {
	const parts: string[] = [];

	if (register !== '"') {
		parts.push(`"${register}`);
	}

	if (count !== null) {
		parts.push(String(count));
	}

	if (operator !== null) {
		parts.push(operator);
	}

	if (motion !== null) {
		parts.push(motion);
	}

	return parts.length > 0 ? parts.join("") : null;
}

/**
 * Vim mode status line component
 * Displays current mode, pending operations, and toggle button
 */
export function VimStatusLine({
	enabled,
	mode,
	pendingOperator,
	pendingCount,
	pendingMotion,
	currentRegister,
	statusMessage,
	statusMessageType,
	cursorLine,
	cursorColumn,
	onToggle,
}: VimStatusLineProps) {
	const pendingState = formatPendingState(
		pendingOperator,
		pendingCount,
		pendingMotion,
		currentRegister,
	);

	return (
		<div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t bg-muted/80 px-3 py-1.5 text-xs backdrop-blur-sm">
			<div className="flex items-center gap-2">
				{/* Vim toggle button */}
				<button
					type="button"
					onClick={onToggle}
					className={cn(
						"flex items-center gap-1.5 rounded px-2 py-0.5 transition-colors",
						enabled
							? "bg-primary/10 text-primary hover:bg-primary/20"
							: "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20",
					)}
					title={enabled ? "Disable vim mode (Ctrl+Shift+V)" : "Enable vim mode (Ctrl+Shift+V)"}
				>
					{enabled ? (
						<Power className="h-3 w-3" />
					) : (
						<PowerOff className="h-3 w-3" />
					)}
					<span className="font-medium">VIM</span>
				</button>

				{/* Mode badge (only shown when enabled) */}
				{enabled && (
					<span
						className={cn(
							"rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider",
							getModeStyle(mode),
						)}
					>
						{getModeName(mode)}
					</span>
				)}

				{/* Pending state indicator */}
				{enabled && pendingState && (
					<span className="rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-orange-600 dark:text-orange-400">
						{pendingState}_
					</span>
				)}

				{/* Status message */}
				{enabled && statusMessage && (
					<span
						className={cn(
							"rounded px-1.5 py-0.5 text-[10px]",
							statusMessageType === "error" &&
								"bg-red-500/10 text-red-600 dark:text-red-400",
							statusMessageType === "warning" &&
								"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
							statusMessageType === "info" &&
								"bg-blue-500/10 text-blue-600 dark:text-blue-400",
						)}
					>
						{statusMessage}
					</span>
				)}
			</div>

			{/* Right side - cursor position and keyboard hints */}
			<div className="flex items-center gap-4 text-muted-foreground">
				{/* Cursor position */}
				{enabled && (
					<span className="font-mono text-[10px] tabular-nums">
						{cursorLine}:{cursorColumn}
					</span>
				)}

				{/* Keyboard hints */}
				{enabled && (
					<div className="flex items-center gap-2">
						<Keyboard className="h-3 w-3" />
						{mode === "normal" && (
							<span>
								<kbd className="rounded bg-muted px-1">i</kbd> insert{" "}
								<kbd className="rounded bg-muted px-1">v</kbd> visual{" "}
								<kbd className="rounded bg-muted px-1">:</kbd> command
							</span>
						)}
						{mode === "insert" && (
							<span>
								<kbd className="rounded bg-muted px-1">Esc</kbd> normal mode
							</span>
						)}
						{(mode === "visual" || mode === "visual-line" || mode === "visual-block") && (
							<span>
								<kbd className="rounded bg-muted px-1">d</kbd> delete{" "}
								<kbd className="rounded bg-muted px-1">y</kbd> yank{" "}
								<kbd className="rounded bg-muted px-1">Esc</kbd> cancel
							</span>
						)}
						{mode === "command" && (
							<span>
								<kbd className="rounded bg-muted px-1">Enter</kbd> execute{" "}
								<kbd className="rounded bg-muted px-1">Esc</kbd> cancel
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

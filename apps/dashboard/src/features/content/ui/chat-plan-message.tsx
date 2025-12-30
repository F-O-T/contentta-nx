import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import {
	Check,
	SkipForward,
	Play,
	Loader2,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { ChatMessage, PlanStep } from "../context/chat-context";
import {
	updatePlanStep,
	approveAllSteps,
	setChatMode,
} from "../context/chat-context";

interface ChatPlanMessageProps {
	message: ChatMessage;
	onExecutePlan?: (approvedSteps: PlanStep[], executionPrompt: string) => void;
}

function PlanStepItem({
	step,
	messageId,
	index,
	isLast,
	isExecuting,
}: {
	step: PlanStep;
	messageId: string;
	index: number;
	isLast: boolean;
	isExecuting?: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const isPending = step.status === "pending";
	const isApproved = step.status === "approved";
	const isSkipped = step.status === "skipped";
	const isCompleted = step.status === "completed";

	// Status colors and styles
	const getStatusStyles = () => {
		if (isExecuting) {
			return {
				circle: "border-primary bg-primary/10 animate-pulse",
				line: "bg-primary/30",
				text: "text-primary font-medium",
			};
		}
		if (isCompleted) {
			return {
				circle: "border-green-500 bg-green-500",
				line: "bg-green-500",
				text: "text-muted-foreground",
			};
		}
		if (isApproved) {
			return {
				circle: "border-blue-500 bg-blue-500/10",
				line: "bg-blue-500/30",
				text: "text-foreground",
			};
		}
		if (isSkipped) {
			return {
				circle: "border-muted-foreground/30 bg-muted",
				line: "bg-muted",
				text: "text-muted-foreground line-through",
			};
		}
		return {
			circle: "border-muted-foreground/50 bg-background",
			line: "bg-muted-foreground/20",
			text: "text-foreground",
		};
	};

	const styles = getStatusStyles();

	return (
		<div className="flex gap-3">
			{/* Vertical timeline */}
			<div className="flex flex-col items-center">
				{/* Step circle */}
				<div
					className={cn(
						"flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
						styles.circle,
					)}
				>
					{isExecuting ? (
						<Loader2 className="size-3.5 animate-spin text-primary" />
					) : isCompleted ? (
						<Check className="size-3.5 text-white" />
					) : isApproved ? (
						<Check className="size-3.5 text-blue-500" />
					) : isSkipped ? (
						<SkipForward className="size-3 text-muted-foreground" />
					) : (
						<span className="text-xs font-medium text-muted-foreground">
							{index + 1}
						</span>
					)}
				</div>

				{/* Connecting line */}
				{!isLast && (
					<div className={cn("w-0.5 flex-1 min-h-4", styles.line)} />
				)}
			</div>

			{/* Step content */}
			<div className="flex-1 pb-4">
				<div
					className={cn(
						"rounded-lg border p-3 transition-all",
						isExecuting && "border-primary/50 bg-primary/5 shadow-sm",
						isApproved && "border-blue-500/30 bg-blue-500/5",
						isCompleted && "border-green-500/30 bg-green-500/5",
						isSkipped && "border-muted bg-muted/30 opacity-60",
						isPending && "border-border bg-card hover:border-muted-foreground/30",
					)}
				>
					{/* Step header */}
					<div
						className="flex items-start justify-between cursor-pointer"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						<p className={cn("text-sm flex-1", styles.text)}>{step.step}</p>
						<button className="ml-2 p-0.5 hover:bg-muted rounded">
							{isExpanded ? (
								<ChevronUp className="size-4 text-muted-foreground" />
							) : (
								<ChevronDown className="size-4 text-muted-foreground" />
							)}
						</button>
					</div>

					{/* Expanded details (placeholder for rationale/preview) */}
					{isExpanded && (
						<div className="mt-2 pt-2 border-t border-dashed text-xs text-muted-foreground space-y-2">
							{step.description && <p>{step.description}</p>}
							{step.rationale && (
								<p className="italic">
									<span className="font-medium">Rationale:</span>{" "}
									{step.rationale}
								</p>
							)}
							{step.toolsToUse && step.toolsToUse.length > 0 && (
								<p>
									<span className="font-medium">Tools:</span>{" "}
									{step.toolsToUse.join(", ")}
								</p>
							)}
							{!step.description && !step.rationale && !step.toolsToUse && (
								<p>No additional details available.</p>
							)}
						</div>
					)}

					{/* Actions for pending steps */}
					{isPending && !isExecuting && (
						<div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed">
							<Button
								size="sm"
								variant="outline"
								className="h-6 text-xs px-2"
								onClick={(e) => {
									e.stopPropagation();
									updatePlanStep(messageId, step.id, "approved");
								}}
							>
								<Check className="size-3 mr-1" />
								Approve
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-6 text-xs px-2 text-muted-foreground"
								onClick={(e) => {
									e.stopPropagation();
									updatePlanStep(messageId, step.id, "skipped");
								}}
							>
								<SkipForward className="size-3 mr-1" />
								Skip
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function ChatPlanMessage({ message, onExecutePlan }: ChatPlanMessageProps) {
	if (!message.planSteps || message.planSteps.length === 0) {
		return null;
	}

	const approvedSteps = message.planSteps.filter(
		(s) => s.status === "approved",
	);
	const completedCount = message.planSteps.filter(
		(s) => s.status === "completed",
	).length;
	const pendingCount = message.planSteps.filter(
		(s) => s.status === "pending",
	).length;
	const totalCount = message.planSteps.filter(
		(s) => s.status !== "skipped",
	).length;

	const hasApprovedSteps = approvedSteps.length > 0;

	const handleExecutePlan = () => {
		// Build execution prompt from approved steps
		const stepDescriptions = approvedSteps
			.map(
				(s, i) =>
					`${i + 1}. ${s.step}${s.description ? `\n   ${s.description}` : ""}`,
			)
			.join("\n");

		const executionPrompt = `Execute these approved plan steps in order:\n\n${stepDescriptions}\n\nExecute each step using the appropriate tools, showing progress as you go.`;

		// Switch to writer mode and execute
		setChatMode("writer");
		if (onExecutePlan) {
			onExecutePlan(approvedSteps, executionPrompt);
		}
	};

	return (
		<div className="py-3">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<div className="size-7 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
						<span className="text-sm">📋</span>
					</div>
					<div>
						<span className="text-sm font-semibold">Content Plan</span>
						<p className="text-xs text-muted-foreground">
							{completedCount > 0
								? `${completedCount}/${totalCount} completed`
								: `${totalCount} steps`}
						</p>
					</div>
				</div>

				{/* Progress indicator */}
				<div className="flex items-center gap-1.5">
					{message.planSteps.map((step, i) => (
						<div
							key={`indicator-${i + 1}`}
							className={cn(
								"size-2 rounded-full transition-colors",
								step.status === "completed" && "bg-green-500",
								step.status === "approved" && "bg-blue-500",
								step.status === "skipped" && "bg-muted-foreground/30",
								step.status === "pending" && "bg-muted-foreground/20 border border-muted-foreground/30",
							)}
						/>
					))}
				</div>
			</div>

			{/* Optional plan description */}
			{message.content && (
				<div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
					{message.content}
				</div>
			)}

			{/* Steps with vertical stepper */}
			<div className="relative">
				{message.planSteps.map((step, index) => (
					<PlanStepItem
						key={step.id}
						step={step}
						messageId={message.id}
						index={index}
						isLast={index === message.planSteps!.length - 1}
					/>
				))}
			</div>

			{/* Action buttons */}
			<div className="flex items-center gap-2 mt-2 pt-3 border-t">
				{pendingCount > 0 && (
					<>
						<Button
							size="sm"
							variant="outline"
							className="h-8 text-xs"
							onClick={() => approveAllSteps(message.id)}
						>
							<Check className="size-3.5 mr-1.5" />
							Approve All ({pendingCount})
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-8 text-xs text-muted-foreground"
							onClick={() => {
								for (const step of message.planSteps || []) {
									if (step.status === "pending") {
										updatePlanStep(message.id, step.id, "skipped");
									}
								}
							}}
						>
							Skip All
						</Button>
					</>
				)}

				{hasApprovedSteps && (
					<Button
						size="sm"
						className="h-8 text-xs ml-auto"
						onClick={handleExecutePlan}
					>
						<Play className="size-3.5 mr-1.5" />
						Execute Plan ({approvedSteps.length} steps)
					</Button>
				)}
			</div>
		</div>
	);
}

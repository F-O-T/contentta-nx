import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { Check, SkipForward, Circle, CheckCircle2 } from "lucide-react";
import type { ChatMessage, PlanStep } from "../context/chat-context";
import { updatePlanStep } from "../context/chat-context";

interface ChatPlanMessageProps {
	message: ChatMessage;
}

function PlanStepItem({
	step,
	messageId,
	index,
}: {
	step: PlanStep;
	messageId: string;
	index: number;
}) {
	const isPending = step.status === "pending";
	const isApproved = step.status === "approved";
	const isSkipped = step.status === "skipped";
	const isCompleted = step.status === "completed";

	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-md p-2 transition-colors",
				isPending && "bg-muted/50",
				isApproved && "bg-primary/5",
				isSkipped && "bg-muted/30 opacity-60",
				isCompleted && "bg-green-500/5",
			)}
		>
			{/* Step number/status indicator */}
			<div className="flex size-6 shrink-0 items-center justify-center">
				{isCompleted ? (
					<CheckCircle2 className="size-5 text-green-500" />
				) : isSkipped ? (
					<SkipForward className="size-4 text-muted-foreground" />
				) : isApproved ? (
					<Check className="size-4 text-primary" />
				) : (
					<Circle className="size-4 text-muted-foreground" />
				)}
			</div>

			{/* Step content */}
			<div className="flex-1 min-w-0">
				<p
					className={cn(
						"text-sm",
						isSkipped && "line-through text-muted-foreground",
						isCompleted && "text-muted-foreground",
					)}
				>
					<span className="font-medium text-muted-foreground mr-1.5">
						{index + 1}.
					</span>
					{step.step}
				</p>

				{/* Actions for pending steps */}
				{isPending && (
					<div className="flex items-center gap-2 mt-2">
						<Button
							size="sm"
							variant="outline"
							className="h-7 text-xs"
							onClick={() => updatePlanStep(messageId, step.id, "approved")}
						>
							<Check className="size-3 mr-1" />
							Approve
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-7 text-xs text-muted-foreground"
							onClick={() => updatePlanStep(messageId, step.id, "skipped")}
						>
							<SkipForward className="size-3 mr-1" />
							Skip
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

export function ChatPlanMessage({ message }: ChatPlanMessageProps) {
	if (!message.planSteps || message.planSteps.length === 0) {
		return null;
	}

	const completedCount = message.planSteps.filter(
		(s) => s.status === "completed" || s.status === "approved",
	).length;
	const totalCount = message.planSteps.filter(
		(s) => s.status !== "skipped",
	).length;

	return (
		<div className="py-3">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
						<span className="text-xs">📋</span>
					</div>
					<span className="text-sm font-medium">Plan</span>
				</div>
				<span className="text-xs text-muted-foreground">
					{completedCount}/{totalCount} steps
				</span>
			</div>

			{/* Optional plan description */}
			{message.content && (
				<p className="text-sm text-muted-foreground mb-3">{message.content}</p>
			)}

			{/* Steps */}
			<div className="space-y-1">
				{message.planSteps.map((step, index) => (
					<PlanStepItem
						key={step.id}
						step={step}
						messageId={message.id}
						index={index}
					/>
				))}
			</div>

			{/* Quick actions */}
			<div className="flex items-center gap-2 mt-3 pt-3 border-t">
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-xs"
					onClick={() => {
						for (const step of message.planSteps || []) {
							if (step.status === "pending") {
								updatePlanStep(message.id, step.id, "approved");
							}
						}
					}}
				>
					Approve All
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 text-xs text-muted-foreground"
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
			</div>
		</div>
	);
}

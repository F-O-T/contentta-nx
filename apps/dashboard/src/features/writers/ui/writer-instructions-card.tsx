import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Pencil, MessageSquare, Users, BookOpen, Palette } from "lucide-react";
import { useSheet } from "@/hooks/use-sheet";
import { WriterInstructionsForm } from "./writer-instructions-form";

type WriterInstructions = {
	tone?: string;
	style?: string;
	audienceProfile?: string;
	writingGuidelines?: string;
};

type WriterInstructionsCardProps = {
	writerId: string;
	writerName: string;
	instructions?: WriterInstructions;
};

function InstructionItem({
	icon: Icon,
	label,
	value,
	emptyText,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value?: string;
	emptyText: string;
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
				<Icon className="size-4" />
				{label}
			</div>
			{value ? (
				<p className="text-sm">{value}</p>
			) : (
				<p className="text-sm text-muted-foreground italic">{emptyText}</p>
			)}
		</div>
	);
}

export function WriterInstructionsCard({
	writerId,
	writerName,
	instructions,
}: WriterInstructionsCardProps) {
	const { openSheet } = useSheet();

	const handleEditInstructions = () => {
		openSheet({
			children: (
				<WriterInstructionsForm
					instructions={instructions}
					writerId={writerId}
					writerName={writerName}
				/>
			),
		});
	};

	const hasAnyInstructions =
		instructions?.tone ||
		instructions?.style ||
		instructions?.audienceProfile ||
		instructions?.writingGuidelines;

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{translate("dashboard.routes.writers.form.instructions-title")}
				</CardTitle>
				<CardDescription>
					{translate("dashboard.routes.writers.form.instructions-description")}
				</CardDescription>
				<CardAction>
					<Button onClick={handleEditInstructions} size="sm" variant="outline">
						<Pencil className="size-4" />
						{translate("common.actions.edit")}
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				{hasAnyInstructions ? (
					<div className="grid gap-6 sm:grid-cols-2">
						<InstructionItem
							emptyText={translate("common.labels.not-set")}
							icon={MessageSquare}
							label={translate("dashboard.routes.writers.form.tone")}
							value={instructions?.tone}
						/>
						<InstructionItem
							emptyText={translate("common.labels.not-set")}
							icon={Palette}
							label={translate("dashboard.routes.writers.form.style")}
							value={instructions?.style}
						/>
						<InstructionItem
							emptyText={translate("common.labels.not-set")}
							icon={Users}
							label={translate("dashboard.routes.writers.form.audience")}
							value={instructions?.audienceProfile}
						/>
						<InstructionItem
							emptyText={translate("common.labels.not-set")}
							icon={BookOpen}
							label={translate("dashboard.routes.writers.form.guidelines")}
							value={instructions?.writingGuidelines}
						/>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<div className="rounded-full bg-muted p-3 mb-3">
							<BookOpen className="size-6 text-muted-foreground" />
						</div>
						<p className="text-sm text-muted-foreground mb-3">
							{translate("dashboard.routes.writers.details.no-instructions")}
						</p>
						<Button onClick={handleEditInstructions} size="sm" variant="outline">
							<Pencil className="size-4" />
							{translate("common.actions.add")}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

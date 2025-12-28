import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	BarChart3,
	Copy,
	FileText,
	Pencil,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ManageWriterForm } from "@/features/writers/ui/manage-writer-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type Writer = {
	id: string;
	personaConfig: {
		metadata: {
			name: string;
			description?: string;
		};
		instructions?: {
			writingGuidelines?: string;
			audienceProfile?: string;
			tone?: string;
			style?: string;
		};
	};
	profilePhotoUrl?: string | null;
};

type WriterActionButtonsProps = {
	writer: Writer;
	onDeleteSuccess?: () => void;
};

export function WriterActionButtons({
	writer,
	onDeleteSuccess,
}: WriterActionButtonsProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { activeOrganization } = useActiveOrganization();
	const { openAlertDialog } = useAlertDialog();
	const { openSheet } = useSheet();

	const deleteMutation = useMutation(
		trpc.agent.delete.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.writers.delete-success"));
				queryClient.invalidateQueries({ queryKey: trpc.agent.list.queryKey() });
				queryClient.invalidateQueries({ queryKey: trpc.agent.getStats.queryKey() });
				if (onDeleteSuccess) {
					onDeleteSuccess();
				} else {
					navigate({
						to: "/$slug/writers",
						params: { slug: activeOrganization.slug },
					});
				}
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const duplicateMutation = useMutation(
		trpc.agent.duplicate.mutationOptions({
			onSuccess: (duplicated) => {
				toast.success(translate("dashboard.routes.writers.actions.duplicate-success"));
				queryClient.invalidateQueries({ queryKey: trpc.agent.list.queryKey() });
				queryClient.invalidateQueries({ queryKey: trpc.agent.getStats.queryKey() });
				navigate({
					to: "/$slug/writers/$writerId",
					params: { slug: activeOrganization.slug, writerId: duplicated.id },
				});
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const handleEdit = () => {
		openSheet({
			children: <ManageWriterForm writer={writer} />,
		});
	};

	const handleDelete = () => {
		openAlertDialog({
			actionLabel: translate("common.actions.delete"),
			cancelLabel: translate("common.actions.cancel"),
			description: `${translate("common.headers.delete-confirmation.description")} ${writer.personaConfig.metadata.name}?`,
			onAction: () => deleteMutation.mutate({ id: writer.id }),
			title: translate("common.headers.delete-confirmation.title"),
			variant: "destructive",
		});
	};

	const handleDuplicate = () => {
		duplicateMutation.mutate({ id: writer.id });
	};

	const handleGenerateContent = () => {
		navigate({
			to: "/$slug/content/new",
			params: { slug: activeOrganization.slug },
			search: { writerId: writer.id },
		});
	};

	const isPending = deleteMutation.isPending || duplicateMutation.isPending;

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Group 1: Content Actions */}
			<Button
				disabled={isPending}
				onClick={handleGenerateContent}
				variant="outline"
			>
				<FileText className="size-4" />
				{translate("dashboard.routes.writers.actions.generate-content")}
			</Button>
			<Button
				disabled={isPending}
				onClick={() => {
					// TODO: Navigate to analytics page when available
					toast.info("Analytics coming soon");
				}}
				variant="outline"
			>
				<BarChart3 className="size-4" />
				{translate("dashboard.routes.writers.actions.view-analytics")}
			</Button>

			{/* Separator */}
			<div className="h-6 w-px bg-border hidden sm:block" />

			{/* Group 2: Management Actions */}
			<Button
				disabled={isPending}
				onClick={handleEdit}
				variant="outline"
			>
				<Pencil className="size-4" />
				{translate("common.actions.edit")}
			</Button>
			<Button
				disabled={isPending}
				onClick={handleDuplicate}
				variant="outline"
			>
				<Copy className="size-4" />
				{translate("dashboard.routes.writers.actions.duplicate")}
			</Button>

			{/* Separator */}
			<div className="h-6 w-px bg-border hidden sm:block" />

			{/* Group 3: Destructive Action */}
			<Button
				className="text-destructive hover:text-destructive"
				disabled={isPending}
				onClick={handleDelete}
				variant="outline"
			>
				<Trash2 className="size-4" />
				{translate("common.actions.delete")}
			</Button>
		</div>
	);
}

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@packages/ui/components/empty";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import {
	SelectionActionBar,
	SelectionActionButton,
} from "@packages/ui/components/selection-action-bar";
import { Skeleton } from "@packages/ui/components/skeleton";
import type { RowSelectionState } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, PenTool, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { ManageWriterForm } from "./manage-writer-form";
import { WritersMobileCard } from "./writers-mobile-card";
import { createWriterColumns, type Writer } from "./writers-table-columns";

type WritersDataTableProps = {
	writers: Writer[];
	filters: {
		searchTerm: string;
		onSearchChange: (value: string) => void;
		hasActiveFilters: boolean;
		onClearFilters: () => void;
	};
	pagination?: {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	};
	onDelete?: (writerId: string) => void;
	onBulkDelete?: (writerIds: string[]) => void;
};

export function WritersDataTableSkeleton() {
	return (
		<Card>
			<CardContent className="pt-6 grid gap-4">
				<div className="flex flex-col sm:flex-row gap-3">
					<Skeleton className="h-9 flex-1 sm:max-w-md" />
				</div>
				<ItemGroup>
					{Array.from({ length: 5 }).map((_, index) => (
						<Fragment key={`writer-skeleton-${index + 1}`}>
							<div className="flex items-center p-4 gap-4">
								<Skeleton className="size-10 rounded-full" />
								<div className="space-y-2 flex-1">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-4 w-20" />
							</div>
							{index !== 4 && <ItemSeparator />}
						</Fragment>
					))}
				</ItemGroup>
			</CardContent>
		</Card>
	);
}

export function WritersDataTable({
	writers,
	filters,
	pagination,
	onDelete,
	onBulkDelete,
}: WritersDataTableProps) {
	const { activeOrganization } = useActiveOrganization();
	const { openAlertDialog } = useAlertDialog();
	const { openSheet } = useSheet();
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const hasSearchTerm = filters.searchTerm.length > 0;

	const selectedIds = Object.keys(rowSelection).filter(
		(id) => rowSelection[id],
	);

	const handleClearSelection = () => {
		setRowSelection({});
	};

	const handleEditWriter = (writer: Writer) => {
		openSheet({
			children: <ManageWriterForm writer={writer} />,
		});
	};

	const handleDeleteWriter = (writer: Writer) => {
		if (!onDelete) return;

		openAlertDialog({
			actionLabel: translate("common.actions.delete"),
			cancelLabel: translate("common.actions.cancel"),
			description: `${translate("common.headers.delete-confirmation.description")} ${writer.personaConfig.metadata.name}?`,
			onAction: () => onDelete(writer.id),
			title: translate("common.headers.delete-confirmation.title"),
			variant: "destructive",
		});
	};

	const handleBulkDelete = () => {
		if (!onBulkDelete || selectedIds.length === 0) return;

		openAlertDialog({
			actionLabel: translate("common.actions.delete"),
			cancelLabel: translate("common.actions.cancel"),
			description: translate(
				"common.headers.delete-confirmation.description-bulk",
				{ count: selectedIds.length },
			),
			onAction: () => {
				onBulkDelete(selectedIds);
				setRowSelection({});
			},
			title: translate("common.headers.delete-confirmation.title"),
			variant: "destructive",
		});
	};

	if (writers.length === 0 && !hasSearchTerm) {
		return (
			<Card>
				<CardContent className="pt-6">
					<Empty>
						<EmptyContent>
							<EmptyMedia variant="icon">
								<PenTool className="size-12 text-muted-foreground" />
							</EmptyMedia>
							<EmptyTitle>
								{translate("dashboard.routes.writers.empty.title")}
							</EmptyTitle>
							<EmptyDescription>
								{translate("dashboard.routes.writers.empty.description")}
							</EmptyDescription>
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardContent className="space-y-4 pt-6">
					{writers.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							{translate("dashboard.routes.writers.no-results")}
						</div>
					) : (
						<>
							<DataTable
								columns={createWriterColumns(
									activeOrganization.slug,
									handleEditWriter,
									handleDeleteWriter,
								)}
								data={writers}
								enableRowSelection
								getRowId={(row) => row.id}
								onRowSelectionChange={setRowSelection}
								renderMobileCard={(props) => (
									<WritersMobileCard
										{...props}
										onDelete={handleDeleteWriter}
										onEdit={handleEditWriter}
										slug={activeOrganization.slug}
									/>
								)}
								rowSelection={rowSelection}
							/>

							{pagination && pagination.totalPages > 1 && (
								<div className="flex items-center justify-between border-t pt-4">
									<p className="text-sm text-muted-foreground">
										{translate("common.form.pagination.page", {
											current: pagination.currentPage,
											total: pagination.totalPages,
										})}
									</p>
									<div className="flex items-center gap-2">
										<Button
											disabled={pagination.currentPage <= 1}
											onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
											size="sm"
											variant="outline"
										>
											<ChevronLeft className="size-4" />
											{translate("common.actions.previous")}
										</Button>
										<Button
											disabled={pagination.currentPage >= pagination.totalPages}
											onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
											size="sm"
											variant="outline"
										>
											{translate("common.actions.next")}
											<ChevronRight className="size-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			<SelectionActionBar
				onClear={handleClearSelection}
				selectedCount={selectedIds.length}
			>
				{onBulkDelete && (
					<SelectionActionButton
						icon={<Trash2 className="size-3.5" />}
						onClick={handleBulkDelete}
						variant="destructive"
					>
						{translate("common.actions.delete")}
					</SelectionActionButton>
				)}
			</SelectionActionBar>
		</>
	);
}

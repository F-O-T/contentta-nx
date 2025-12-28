import { translate } from "@packages/localization";
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
import { FileText, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { ManageContentForm } from "./manage-content-form";
import { ContentFilterBar } from "./content-filter-bar";
import { ContentMobileCard } from "./content-mobile-card";
import { createContentColumns, type ContentItem } from "./content-table-columns";

type ContentDataTableProps = {
	contents: ContentItem[];
	filters: {
		searchTerm: string;
		onSearchChange: (value: string) => void;
		statusFilter: string;
		onStatusFilterChange: (value: string) => void;
		hasActiveFilters: boolean;
		onClearFilters: () => void;
	};
	onDelete?: (contentId: string) => void;
	onBulkDelete?: (contentIds: string[]) => void;
	onPublish?: (contentId: string) => void;
	onArchive?: (contentId: string) => void;
};

export function ContentDataTableSkeleton() {
	return (
		<Card>
			<CardContent className="pt-6 grid gap-4">
				<div className="flex flex-col sm:flex-row gap-3">
					<Skeleton className="h-9 flex-1 sm:max-w-md" />
					<Skeleton className="h-9 w-[150px]" />
				</div>
				<ItemGroup>
					{Array.from({ length: 5 }).map((_, index) => (
						<Fragment key={`content-skeleton-${index + 1}`}>
							<div className="flex items-center p-4 gap-4">
								<div className="space-y-2 flex-1">
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-64" />
								</div>
								<Skeleton className="h-6 w-6 rounded-full" />
								<Skeleton className="h-6 w-16" />
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

export function ContentDataTable({
	contents,
	filters,
	onDelete,
	onBulkDelete,
	onPublish,
	onArchive,
}: ContentDataTableProps) {
	const { activeOrganization } = useActiveOrganization();
	const { openAlertDialog } = useAlertDialog();
	const { openSheet } = useSheet();
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const hasSearchTerm = filters.searchTerm.length > 0;
	const hasStatusFilter = filters.statusFilter !== "all";

	const selectedIds = Object.keys(rowSelection).filter(
		(id) => rowSelection[id],
	);

	const handleClearSelection = () => {
		setRowSelection({});
	};

	const handleEditContent = (content: ContentItem) => {
		openSheet({
			children: <ManageContentForm content={content} />,
		});
	};

	const handleDeleteContent = (content: ContentItem) => {
		if (!onDelete) return;

		openAlertDialog({
			actionLabel: translate("common.actions.delete"),
			cancelLabel: translate("common.actions.cancel"),
			description: `${translate("common.headers.delete-confirmation.description")} "${content.meta.title}"?`,
			onAction: () => onDelete(content.id),
			title: translate("common.headers.delete-confirmation.title"),
			variant: "destructive",
		});
	};

	const handlePublishContent = (content: ContentItem) => {
		if (!onPublish) return;
		onPublish(content.id);
	};

	const handleArchiveContent = (content: ContentItem) => {
		if (!onArchive) return;
		onArchive(content.id);
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

	// Filter contents based on search and status
	const filteredContents = contents.filter((content) => {
		const matchesSearch =
			filters.searchTerm === "" ||
			content.meta.title
				.toLowerCase()
				.includes(filters.searchTerm.toLowerCase()) ||
			content.meta.description
				?.toLowerCase()
				.includes(filters.searchTerm.toLowerCase());

		const matchesStatus =
			filters.statusFilter === "all" ||
			content.status === filters.statusFilter;

		return matchesSearch && matchesStatus;
	});

	if (contents.length === 0 && !hasSearchTerm && !hasStatusFilter) {
		return (
			<Card>
				<CardContent className="pt-6">
					<Empty>
						<EmptyContent>
							<EmptyMedia variant="icon">
								<FileText className="size-12 text-muted-foreground" />
							</EmptyMedia>
							<EmptyTitle>
								{translate("dashboard.routes.content.empty.title")}
							</EmptyTitle>
							<EmptyDescription>
								{translate("dashboard.routes.content.empty.description")}
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
				<CardContent className="space-y-4">
					<ContentFilterBar
						hasActiveFilters={filters.hasActiveFilters}
						onClearFilters={filters.onClearFilters}
						onSearchChange={filters.onSearchChange}
						onStatusFilterChange={filters.onStatusFilterChange}
						searchTerm={filters.searchTerm}
						statusFilter={filters.statusFilter}
					/>

					{filteredContents.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							{translate("dashboard.routes.content.no-results")}
						</div>
					) : (
						<DataTable
							columns={createContentColumns(
								activeOrganization.slug,
								handleEditContent,
								handleDeleteContent,
								handlePublishContent,
								handleArchiveContent,
							)}
							data={filteredContents}
							enableRowSelection
							getRowId={(row) => row.id}
							onRowSelectionChange={setRowSelection}
							renderMobileCard={(props) => (
								<ContentMobileCard
									{...props}
									onArchive={handleArchiveContent}
									onDelete={handleDeleteContent}
									onEdit={handleEditContent}
									onPublish={handlePublishContent}
									slug={activeOrganization.slug}
								/>
							)}
							rowSelection={rowSelection}
						/>
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

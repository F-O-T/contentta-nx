import { translate } from "@packages/localization";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import {
	ContentDataTable,
	ContentDataTableSkeleton,
} from "@/features/content/ui/content-data-table";
import type { ContentItem } from "@/features/content/ui/content-table-columns";
import { useTRPC } from "@/integrations/clients";
import { ContentQuickActionsToolbar } from "./content-quick-actions-toolbar";

function ContentPageContent() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const search = useSearch({ from: "/$slug/_dashboard/content/" });
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const agentId = (search as { agentId?: string }).agentId;

	const { data } = useSuspenseQuery(
		trpc.content.listAllContent.queryOptions({
			limit: 100,
			page: 1,
			status: ["draft", "published", "archived"],
		}),
	);

	// Filter by agentId if provided in search params
	const filteredByAgent = agentId
		? data.items.filter((item) => item.agentId === agentId)
		: data.items;

	// Transform items to include agent info
	const contents: ContentItem[] = filteredByAgent.map((item) => ({
		id: item.id,
		agentId: item.agentId,
		meta: item.meta,
		status: item.status as "draft" | "published" | "archived",
		createdAt: item.createdAt,
		agent: undefined, // We don't have agent info in listAllContent
	}));

	const deleteMutation = useMutation(
		trpc.content.delete.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.delete-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const publishMutation = useMutation(
		trpc.content.publish.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.publish-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const archiveMutation = useMutation(
		trpc.content.archive.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.archive-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const handleDelete = (contentId: string) => {
		deleteMutation.mutate({ id: contentId });
	};

	const handleBulkDelete = (contentIds: string[]) => {
		for (const id of contentIds) {
			deleteMutation.mutate({ id });
		}
	};

	const handlePublish = (contentId: string) => {
		publishMutation.mutate({ id: contentId });
	};

	const handleArchive = (contentId: string) => {
		archiveMutation.mutate({ id: contentId });
	};

	const hasActiveFilters = searchTerm.length > 0 || statusFilter !== "all";

	const handleClearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
	};

	return (
		<ContentDataTable
			contents={contents}
			filters={{
				hasActiveFilters,
				onClearFilters: handleClearFilters,
				onSearchChange: setSearchTerm,
				onStatusFilterChange: setStatusFilter,
				searchTerm,
				statusFilter,
			}}
			onArchive={handleArchive}
			onBulkDelete={handleBulkDelete}
			onDelete={handleDelete}
			onPublish={handlePublish}
		/>
	);
}

function ContentPageError({ error }: { error: Error }) {
	return (
		<div className="text-center py-8">
			<p className="text-muted-foreground">
				{translate("common.errors.default")}
			</p>
			<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
		</div>
	);
}

export function ContentPage() {
	const search = useSearch({ from: "/$slug/_dashboard/content/" });
	const agentId = (search as { agentId?: string }).agentId;

	return (
		<main className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">
						{translate("dashboard.routes.content.title")}
					</h1>
					<p className="text-muted-foreground">
						{translate("dashboard.routes.content.description")}
					</p>
				</div>
				<ContentQuickActionsToolbar agentId={agentId} />
			</div>

			<ErrorBoundary FallbackComponent={ContentPageError}>
				<Suspense fallback={<ContentDataTableSkeleton />}>
					<ContentPageContent />
				</Suspense>
			</ErrorBoundary>
		</main>
	);
}

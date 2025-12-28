import { translate } from "@packages/localization";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useWritersList } from "@/features/writers/lib/writers-list-context";
import {
	WritersDataTable,
	WritersDataTableSkeleton,
} from "@/features/writers/ui/writers-data-table";
import { useTRPC } from "@/integrations/clients";

function WritersListContent() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { searchTerm, hasActiveFilters, clearFilters, setSearchTerm } =
		useWritersList();
	const [page, setPage] = useState(1);
	const limit = 20;

	const { data } = useSuspenseQuery(
		trpc.agent.list.queryOptions({
			limit,
			page,
			search: searchTerm || undefined,
		}),
	);

	const deleteMutation = useMutation(
		trpc.agent.delete.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.writers.delete-success"));
				queryClient.invalidateQueries({ queryKey: trpc.agent.list.queryKey() });
				queryClient.invalidateQueries({ queryKey: trpc.agent.getStats.queryKey() });
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const handleDelete = (writerId: string) => {
		deleteMutation.mutate({ id: writerId });
	};

	const handleBulkDelete = (writerIds: string[]) => {
		for (const id of writerIds) {
			deleteMutation.mutate({ id });
		}
	};

	const pagination = useMemo(
		() => ({
			currentPage: data.page,
			onPageChange: setPage,
			totalPages: data.totalPages,
		}),
		[data.page, data.totalPages],
	);

	return (
		<WritersDataTable
			filters={{
				hasActiveFilters,
				onClearFilters: clearFilters,
				onSearchChange: setSearchTerm,
				searchTerm,
			}}
			onBulkDelete={handleBulkDelete}
			onDelete={handleDelete}
			pagination={pagination}
			writers={data.items}
		/>
	);
}

function WritersListError({ error }: { error: Error }) {
	return (
		<div className="text-center py-8">
			<p className="text-muted-foreground">
				{translate("common.errors.default")}
			</p>
			<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
		</div>
	);
}

export function WritersListSection() {
	return (
		<ErrorBoundary FallbackComponent={WritersListError}>
			<Suspense fallback={<WritersDataTableSkeleton />}>
				<WritersListContent />
			</Suspense>
		</ErrorBoundary>
	);
}

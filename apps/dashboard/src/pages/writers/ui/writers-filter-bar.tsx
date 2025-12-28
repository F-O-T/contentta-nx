import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { InputGroup, InputGroupText } from "@packages/ui/components/input-group";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Search, X } from "lucide-react";
import { useWritersList } from "@/features/writers/lib/writers-list-context";

export function WritersFilterBar() {
	const { searchTerm, setSearchTerm, hasActiveFilters, clearFilters } =
		useWritersList();

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-1 items-center gap-2">
				<InputGroup className="max-w-sm">
					<InputGroupText>
						<Search className="size-4" />
					</InputGroupText>
					<Input
						className="pl-9"
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder={translate("dashboard.routes.writers.filter.search")}
						type="search"
						value={searchTerm}
					/>
				</InputGroup>

				{hasActiveFilters && (
					<Button
						onClick={clearFilters}
						size="sm"
						variant="ghost"
					>
						<X className="size-4" />
						{translate("common.actions.clear-filters")}
					</Button>
				)}
			</div>
		</div>
	);
}

export function WritersFilterBarSkeleton() {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-1 items-center gap-2">
				<Skeleton className="h-10 w-full max-w-sm" />
			</div>
		</div>
	);
}

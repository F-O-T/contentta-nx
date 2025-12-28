import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Search, X } from "lucide-react";

type WritersFilterBarProps = {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
};

export function WritersFilterBar({
	searchTerm,
	onSearchChange,
	hasActiveFilters,
	onClearFilters,
}: WritersFilterBarProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-3 pt-4">
			<div className="relative flex-1 sm:max-w-md">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					className="pl-9"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={translate("dashboard.routes.writers.filter.search")}
					type="search"
					value={searchTerm}
				/>
			</div>

			{hasActiveFilters && (
				<Button
					className="shrink-0"
					onClick={onClearFilters}
					size="sm"
					variant="ghost"
				>
					<X className="mr-1 size-4" />
					{translate("common.actions.clear-filters")}
				</Button>
			)}
		</div>
	);
}

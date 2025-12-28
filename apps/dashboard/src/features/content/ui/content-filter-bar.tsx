import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { Search, X } from "lucide-react";

type ContentFilterBarProps = {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
};

export function ContentFilterBar({
	searchTerm,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	hasActiveFilters,
	onClearFilters,
}: ContentFilterBarProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-3 pt-4">
			<div className="relative flex-1 sm:max-w-md">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					className="pl-9"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={translate("dashboard.routes.content.filter.search")}
					type="search"
					value={searchTerm}
				/>
			</div>

			<Select value={statusFilter} onValueChange={onStatusFilterChange}>
				<SelectTrigger className="w-full sm:w-[150px]">
					<SelectValue placeholder={translate("dashboard.routes.content.filter.status")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{translate("dashboard.routes.content.filter.all-status")}
					</SelectItem>
					<SelectItem value="draft">
						<Badge className="bg-amber-500/10 text-amber-600 border-amber-200" variant="outline">
							{translate("common.status.draft")}
						</Badge>
					</SelectItem>
					<SelectItem value="published">
						<Badge className="bg-green-500/10 text-green-600 border-green-200" variant="outline">
							{translate("common.status.published")}
						</Badge>
					</SelectItem>
					<SelectItem value="archived">
						<Badge className="bg-slate-500/10 text-slate-600 border-slate-200" variant="outline">
							{translate("common.status.archived")}
						</Badge>
					</SelectItem>
				</SelectContent>
			</Select>

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

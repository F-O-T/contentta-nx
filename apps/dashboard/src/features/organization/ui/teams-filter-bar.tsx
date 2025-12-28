import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
import { Search, X } from "lucide-react";

interface TeamsFilterBarProps {
   searchTerm: string;
   onSearchChange: (value: string) => void;
   onClearFilters: () => void;
   hasActiveFilters: boolean;
}

export function TeamsFilterBar({
   searchTerm,
   onSearchChange,
   onClearFilters,
   hasActiveFilters,
}: TeamsFilterBarProps) {
   return (
      <div className="flex flex-wrap items-center gap-3">
         <InputGroup className="sm:max-w-md flex-1">
            <InputGroupInput
               onChange={(e) => onSearchChange(e.target.value)}
               placeholder={translate(
                  "dashboard.routes.organization.teams-table.filters.search",
               )}
               value={searchTerm}
            />
            <InputGroupAddon>
               <Search />
            </InputGroupAddon>
         </InputGroup>

         {hasActiveFilters && (
            <Button
               className="h-8"
               onClick={onClearFilters}
               size="sm"
               variant="ghost"
            >
               <X className="size-4 mr-1" />
               {translate(
                  "dashboard.routes.organization.teams-table.filters.clear",
               )}
            </Button>
         )}
      </div>
   );
}

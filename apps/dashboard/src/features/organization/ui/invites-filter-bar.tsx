import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Check, Clock, Filter, X, XCircle } from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";
import { InvitesFilterCredenza } from "./invites-filter-credenza";

interface InvitesFilterBarProps {
   statusFilter: string;
   onStatusFilterChange: (value: string) => void;
   roleFilter: string;
   onRoleFilterChange: (value: string) => void;
   onClearFilters: () => void;
   hasActiveFilters: boolean;
}

export function InvitesFilterBar({
   statusFilter,
   onStatusFilterChange,
   roleFilter,
   onRoleFilterChange,
   onClearFilters,
   hasActiveFilters,
}: InvitesFilterBarProps) {
   const isMobile = useIsMobile();
   const { openCredenza } = useCredenza();

   if (isMobile) {
      return (
         <div className="flex items-center gap-2">
            <Button
               className="flex-1"
               onClick={() =>
                  openCredenza({
                     children: (
                        <InvitesFilterCredenza
                           hasActiveFilters={hasActiveFilters}
                           onClearFilters={onClearFilters}
                           onRoleFilterChange={onRoleFilterChange}
                           onStatusFilterChange={onStatusFilterChange}
                           roleFilter={roleFilter}
                           statusFilter={statusFilter}
                        />
                     ),
                  })
               }
               variant="outline"
            >
               <Filter className="size-4 mr-2" />
               {translate(
                  "dashboard.routes.organization.invites-table.filters.status",
               )}
               {hasActiveFilters && (
                  <span className="ml-2 size-2 rounded-full bg-primary" />
               )}
            </Button>
         </div>
      );
   }

   return (
      <div className="flex flex-wrap items-center gap-3">
         <ToggleGroup
            onValueChange={(value) => onStatusFilterChange(value || "all")}
            type="single"
            value={statusFilter === "all" ? "" : statusFilter}
         >
            <ToggleGroupItem aria-label="Pending" value="pending">
               <Clock className="size-4 mr-1" />
               {translate(
                  "dashboard.routes.organization.invites-table.status.pending",
               )}
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Accepted" value="accepted">
               <Check className="size-4 mr-1" />
               {translate(
                  "dashboard.routes.organization.invites-table.status.accepted",
               )}
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Expired" value="expired">
               <X className="size-4 mr-1" />
               {translate(
                  "dashboard.routes.organization.invites-table.status.expired",
               )}
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Canceled" value="canceled">
               <XCircle className="size-4 mr-1" />
               {translate(
                  "dashboard.routes.organization.invites-table.status.canceled",
               )}
            </ToggleGroupItem>
         </ToggleGroup>

         {roleFilter !== "all" && (
            <Badge
               className="cursor-pointer"
               onClick={() => onRoleFilterChange("all")}
               variant="secondary"
            >
               {translate(
                  "dashboard.routes.organization.invites-table.filters.role",
               )}
               : {roleFilter}
               <X className="size-3 ml-1" />
            </Badge>
         )}

         {hasActiveFilters && (
            <Button
               className="h-8"
               onClick={onClearFilters}
               size="sm"
               variant="ghost"
            >
               <X className="size-4 mr-1" />
               {translate(
                  "dashboard.routes.organization.invites-table.filters.clear",
               )}
            </Button>
         )}
      </div>
   );
}

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Crown, Filter, Shield, User, X } from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";
import { MembersFilterCredenza } from "./members-filter-credenza";

interface MembersFilterBarProps {
   roleFilter: string;
   onRoleFilterChange: (value: string) => void;
   onClearFilters: () => void;
   hasActiveFilters: boolean;
}

export function MembersFilterBar({
   roleFilter,
   onRoleFilterChange,
   onClearFilters,
   hasActiveFilters,
}: MembersFilterBarProps) {
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
                        <MembersFilterCredenza
                           hasActiveFilters={hasActiveFilters}
                           onClearFilters={onClearFilters}
                           onRoleFilterChange={onRoleFilterChange}
                           roleFilter={roleFilter}
                        />
                     ),
                  })
               }
               variant="outline"
            >
               <Filter className="size-4 mr-2" />
               {translate(
                  "dashboard.routes.organization.members-table.filters.role",
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
            onValueChange={(value) => onRoleFilterChange(value || "all")}
            type="single"
            value={roleFilter === "all" ? "" : roleFilter}
         >
            <ToggleGroupItem aria-label="Owner" value="owner">
               <Crown className="size-4 mr-1" />
               {translate("dashboard.routes.organization.roles.owner")}
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Admin" value="admin">
               <Shield className="size-4 mr-1" />
               {translate("dashboard.routes.organization.roles.admin")}
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Member" value="member">
               <User className="size-4 mr-1" />
               {translate("dashboard.routes.organization.roles.member")}
            </ToggleGroupItem>
         </ToggleGroup>

         {hasActiveFilters && (
            <Button
               className="h-8"
               onClick={onClearFilters}
               size="sm"
               variant="ghost"
            >
               <X className="size-4 mr-1" />
               {translate(
                  "dashboard.routes.organization.members-table.filters.clear",
               )}
            </Button>
         )}
      </div>
   );
}

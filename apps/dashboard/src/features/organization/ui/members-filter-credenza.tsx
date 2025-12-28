import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { Crown, Shield, User, X } from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";

interface MembersFilterCredenzaProps {
   roleFilter: string;
   onRoleFilterChange: (value: string) => void;
   onClearFilters: () => void;
   hasActiveFilters: boolean;
}

export function MembersFilterCredenza({
   roleFilter,
   onRoleFilterChange,
   onClearFilters,
   hasActiveFilters,
}: MembersFilterCredenzaProps) {
   const { closeCredenza } = useCredenza();

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate(
                  "dashboard.routes.organization.members-table.filters.role",
               )}
            </CredenzaTitle>
         </CredenzaHeader>
         <CredenzaBody className="space-y-4">
            <div className="space-y-2">
               <p className="text-sm font-medium">
                  {translate(
                     "dashboard.routes.organization.members-table.filters.role",
                  )}
               </p>
               <ToggleGroup
                  className="flex-wrap justify-start"
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
            </div>

            {hasActiveFilters && (
               <Button
                  className="w-full"
                  onClick={onClearFilters}
                  variant="outline"
               >
                  <X className="size-4 mr-2" />
                  {translate(
                     "dashboard.routes.organization.members-table.filters.clear",
                  )}
               </Button>
            )}
         </CredenzaBody>
         <CredenzaFooter>
            <Button className="w-full" onClick={closeCredenza}>
               {translate("common.actions.close")}
            </Button>
         </CredenzaFooter>
      </>
   );
}

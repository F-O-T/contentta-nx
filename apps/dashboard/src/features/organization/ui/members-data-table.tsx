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
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import {
   SelectionActionBar,
   SelectionActionButton,
} from "@packages/ui/components/selection-action-bar";
import { Skeleton } from "@packages/ui/components/skeleton";
import type { RowSelectionState } from "@tanstack/react-table";
import { Search, Shield, Trash2, Users } from "lucide-react";
import { Fragment, useState } from "react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { MembersFilterBar } from "./members-filter-bar";
import { MembersMobileCard } from "./members-mobile-card";
import { createMemberColumns, type Member } from "./members-table-columns";

type MembersDataTableProps = {
   members: Member[];
   filters: {
      searchTerm: string;
      onSearchChange: (value: string) => void;
      roleFilter: string;
      onRoleFilterChange: (value: string) => void;
      hasActiveFilters: boolean;
      onClearFilters: () => void;
   };
   onChangeRole?: (member: Member) => void;
   onRemove?: (memberId: string) => void;
   onBulkRemove?: (memberIds: string[]) => void;
};

export function MembersDataTableSkeleton() {
   return (
      <Card>
         <CardContent className="pt-6 grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
               <Skeleton className="h-9 flex-1 sm:max-w-md" />
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`member-skeleton-${index + 1}`}>
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                     </div>
                     {index !== 4 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

export function MembersDataTable({
   members,
   filters,
   onChangeRole,
   onRemove,
   onBulkRemove,
}: MembersDataTableProps) {
   const { openAlertDialog } = useAlertDialog();
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

   const hasSearchTerm = filters.searchTerm.length > 0;

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );

   const handleClearSelection = () => {
      setRowSelection({});
   };

   const handleRemoveMember = (member: Member) => {
      if (!onRemove) return;

      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.organization.members-table.actions.remove",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: `${translate("common.headers.delete-confirmation.description")} ${member.user.name}?`,
         onAction: () => onRemove(member.id),
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   const handleBulkRemove = () => {
      if (!onBulkRemove || selectedIds.length === 0) return;

      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.organization.members-table.bulk-actions.remove",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "common.headers.delete-confirmation.description-bulk",
            { count: selectedIds.length },
         ),
         onAction: () => {
            onBulkRemove(selectedIds);
            setRowSelection({});
         },
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   // Filter members based on search and role
   const filteredMembers = members.filter((member) => {
      const matchesSearch =
         filters.searchTerm === "" ||
         member.user.name
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
         member.user.email
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase());

      const matchesRole =
         filters.roleFilter === "all" ||
         member.role.toLowerCase() === filters.roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
   });

   if (members.length === 0 && !hasSearchTerm) {
      return (
         <Card>
            <CardContent className="pt-6">
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Users className="size-12 text-muted-foreground" />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.organization.members-table.empty",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.organization.members-table.description",
                        )}
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
               <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <InputGroup className="sm:max-w-md">
                     <InputGroupInput
                        onChange={(e) => filters.onSearchChange(e.target.value)}
                        placeholder={translate(
                           "dashboard.routes.organization.members-table.filters.search",
                        )}
                        value={filters.searchTerm}
                     />
                     <InputGroupAddon>
                        <Search />
                     </InputGroupAddon>
                  </InputGroup>

                  <MembersFilterBar
                     hasActiveFilters={filters.hasActiveFilters}
                     onClearFilters={filters.onClearFilters}
                     onRoleFilterChange={filters.onRoleFilterChange}
                     roleFilter={filters.roleFilter}
                  />
               </div>

               {filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                     {translate(
                        "dashboard.routes.organization.members-table.empty",
                     )}
                  </div>
               ) : (
                  <DataTable
                     columns={createMemberColumns(
                        onChangeRole,
                        handleRemoveMember,
                     )}
                     data={filteredMembers}
                     enableRowSelection
                     getRowId={(row) => row.id}
                     onRowSelectionChange={setRowSelection}
                     renderMobileCard={(props) => (
                        <MembersMobileCard
                           {...props}
                           onChangeRole={onChangeRole}
                           onRemove={handleRemoveMember}
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
            <SelectionActionButton
               disabled
               icon={<Shield className="size-3.5" />}
            >
               {translate(
                  "dashboard.routes.organization.members-table.bulk-actions.change-role",
               )}
            </SelectionActionButton>
            {onBulkRemove && (
               <SelectionActionButton
                  icon={<Trash2 className="size-3.5" />}
                  onClick={handleBulkRemove}
                  variant="destructive"
               >
                  {translate(
                     "dashboard.routes.organization.members-table.bulk-actions.remove",
                  )}
               </SelectionActionButton>
            )}
         </SelectionActionBar>
      </>
   );
}

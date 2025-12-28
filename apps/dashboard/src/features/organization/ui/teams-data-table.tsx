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
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import {
   SelectionActionBar,
   SelectionActionButton,
} from "@packages/ui/components/selection-action-bar";
import { Skeleton } from "@packages/ui/components/skeleton";
import type { RowSelectionState } from "@tanstack/react-table";
import { Trash2, Users } from "lucide-react";
import { Fragment, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { TeamsFilterBar } from "./teams-filter-bar";
import { TeamsMobileCard } from "./teams-mobile-card";
import { createTeamColumns, type Team } from "./teams-table-columns";

type TeamsDataTableProps = {
   teams: Team[];
   filters: {
      searchTerm: string;
      onSearchChange: (value: string) => void;
      hasActiveFilters: boolean;
      onClearFilters: () => void;
   };
   onEdit?: (team: Team) => void;
   onDelete?: (teamId: string) => void;
   onBulkDelete?: (teamIds: string[]) => void;
};

export function TeamsDataTableSkeleton() {
   return (
      <Card>
         <CardContent className="pt-6 grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
               <Skeleton className="h-9 flex-1 sm:max-w-md" />
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`team-skeleton-${index + 1}`}>
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-8 rounded-md" />
                        <div className="space-y-2 flex-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                     </div>
                     {index !== 4 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

export function TeamsDataTable({
   teams,
   filters,
   onEdit,
   onDelete,
   onBulkDelete,
}: TeamsDataTableProps) {
   const { activeOrganization } = useActiveOrganization();
   const { openAlertDialog } = useAlertDialog();
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

   const hasSearchTerm = filters.searchTerm.length > 0;

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );

   const handleClearSelection = () => {
      setRowSelection({});
   };

   const handleDeleteTeam = (team: Team) => {
      if (!onDelete) return;

      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.organization.teams-table.actions.delete",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: `${translate("common.headers.delete-confirmation.description")} ${team.name}?`,
         onAction: () => onDelete(team.id),
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   const handleBulkDelete = () => {
      if (!onBulkDelete || selectedIds.length === 0) return;

      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.organization.teams-table.bulk-actions.delete",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "common.headers.delete-confirmation.description-bulk",
            { count: selectedIds.length },
         ),
         onAction: () => {
            onBulkDelete(selectedIds);
            setRowSelection({});
         },
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   };

   // Filter teams based on search
   const filteredTeams = teams.filter((team) => {
      const matchesSearch =
         filters.searchTerm === "" ||
         team.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
         team.description
            ?.toLowerCase()
            .includes(filters.searchTerm.toLowerCase());

      return matchesSearch;
   });

   if (teams.length === 0 && !hasSearchTerm) {
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
                           "dashboard.routes.organization.teams-table.empty",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.organization.teams-table.description",
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
               <TeamsFilterBar
                  hasActiveFilters={filters.hasActiveFilters}
                  onClearFilters={filters.onClearFilters}
                  onSearchChange={filters.onSearchChange}
                  searchTerm={filters.searchTerm}
               />

               {filteredTeams.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                     {translate(
                        "dashboard.routes.organization.teams-table.empty",
                     )}
                  </div>
               ) : (
                  <DataTable
                     columns={createTeamColumns(
                        activeOrganization.slug,
                        onEdit,
                        handleDeleteTeam,
                     )}
                     data={filteredTeams}
                     enableRowSelection
                     getRowId={(row) => row.id}
                     onRowSelectionChange={setRowSelection}
                     renderMobileCard={(props) => (
                        <TeamsMobileCard
                           {...props}
                           onDelete={handleDeleteTeam}
                           onEdit={onEdit}
                           slug={activeOrganization.slug}
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
            {onBulkDelete && (
               <SelectionActionButton
                  icon={<Trash2 className="size-3.5" />}
                  onClick={handleBulkDelete}
                  variant="destructive"
               >
                  {translate(
                     "dashboard.routes.organization.teams-table.bulk-actions.delete",
                  )}
               </SelectionActionButton>
            )}
         </SelectionActionBar>
      </>
   );
}

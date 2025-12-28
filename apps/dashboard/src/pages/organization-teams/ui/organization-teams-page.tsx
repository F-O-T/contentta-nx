import { translate } from "@packages/localization";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import {
   TeamsDataTable,
   TeamsDataTableSkeleton,
} from "@/features/organization/ui/teams-data-table";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { TeamsQuickActionsToolbar } from "./organization-teams-quick-actions-toolbar";

function TeamsPageContent() {
   const trpc = useTRPC();
   const [searchTerm, setSearchTerm] = useState("");

   const { data: teams } = useSuspenseQuery(
      trpc.organizationTeams.listTeams.queryOptions(),
   );

   const deleteTeam = useCallback(async (teamId: string) => {
      await betterAuthClient.organization.removeTeam(
         {
            teamId,
         },
         {
            onRequest: () => {
               toast.loading("Deleting team...");
            },
            onSuccess: () => {
               toast.success("Team deleted successfully");
            },
            onError: (ctx) => {
               toast.error(ctx.error.message || "Failed to delete team");
            },
         },
      );
   }, []);

   const handleDelete = (teamId: string) => {
      deleteTeam(teamId);
   };

   const handleBulkDelete = (teamIds: string[]) => {
      for (const id of teamIds) {
         deleteTeam(id);
      }
   };

   const hasActiveFilters = searchTerm.length > 0;

   const handleClearFilters = () => {
      setSearchTerm("");
   };

   return (
      <TeamsDataTable
         filters={{
            hasActiveFilters,
            onClearFilters: handleClearFilters,
            onSearchChange: setSearchTerm,
            searchTerm,
         }}
         onBulkDelete={handleBulkDelete}
         onDelete={handleDelete}
         teams={teams}
      />
   );
}

function TeamsPageError({ error }: { error: Error }) {
   return (
      <div className="text-center py-8">
         <p className="text-muted-foreground">
            {translate("common.errors.default")}
         </p>
         <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </div>
   );
}

export function OrganizationTeamsPage() {
   return (
      <main className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold">
                  {translate("dashboard.routes.organization.teams-table.title")}
               </h1>
               <p className="text-muted-foreground">
                  {translate(
                     "dashboard.routes.organization.teams-table.description",
                  )}
               </p>
            </div>
            <TeamsQuickActionsToolbar />
         </div>

         <ErrorBoundary FallbackComponent={TeamsPageError}>
            <Suspense fallback={<TeamsDataTableSkeleton />}>
               <TeamsPageContent />
            </Suspense>
         </ErrorBoundary>
      </main>
   );
}

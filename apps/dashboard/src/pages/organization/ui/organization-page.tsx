import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building, Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { ManageOrganizationForm } from "@/features/organization/ui/manage-organization-form";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { OrganizationOverviewInvitesSection } from "./organization-overview-invites-section";
import { OrganizationOverviewMembersSection } from "./organization-overview-members-section";
import { OrganizationOverviewQuickActions } from "./organization-overview-quick-actions";
import { OrganizationOverviewStatsCard } from "./organization-overview-stats-card";

function OrganizationPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: translate(
         "dashboard.routes.organization.state.error.description",
      ),
      errorTitle: translate("dashboard.routes.organization.state.error.title"),
      retryText: translate("common.actions.retry"),
   })(props);
}

function OrganizationPageSkeleton() {
   return (
      <main className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
         </div>

         <Skeleton className="h-40 w-full" />

         <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
               <Skeleton className="h-24" key={`skeleton-quick-${i}`} />
            ))}
         </div>

         <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
         </div>
      </main>
   );
}

function OrganizationContent() {
   const trpc = useTRPC();
   const { openSheet } = useSheet();
   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );
   const { data: organizationLimit } = useSuspenseQuery(
      trpc.organization.getOrganizationLimit.queryOptions(),
   );

   const hasReachedLimit =
      (organizations?.length ?? 0) >= (organizationLimit ?? 3);

   if (!organizations?.length) {
      return (
         <main className="flex flex-col h-full w-full">
            <div className="flex-1 flex items-center justify-center">
               <Empty className="max-w-md">
                  <EmptyHeader>
                     <EmptyMedia variant="icon">
                        <Building className="size-12 text-muted-foreground" />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.organization.state.empty.title",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.organization.state.empty.description",
                        )}
                     </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              disabled={hasReachedLimit}
                              onClick={() =>
                                 openSheet({
                                    children: <ManageOrganizationForm />,
                                 })
                              }
                              size="default"
                              variant="default"
                           >
                              <Plus className="size-4" />
                              {translate(
                                 "dashboard.routes.organization.state.empty.action",
                              )}
                           </Button>
                        </TooltipTrigger>
                        {hasReachedLimit && (
                           <TooltipContent>
                              <p>
                                 {translate(
                                    "dashboard.routes.organization.state.limit-reached",
                                 )}
                              </p>
                           </TooltipContent>
                        )}
                     </Tooltip>
                  </EmptyContent>
               </Empty>
            </div>
         </main>
      );
   }

   return (
      <main className="flex flex-col gap-6">
         <DefaultHeader
            description={translate("dashboard.routes.organization.description")}
            title={translate("dashboard.routes.organization.title")}
         />

         <OrganizationOverviewStatsCard />

         <OrganizationOverviewQuickActions />

         <div className="grid gap-4 md:grid-cols-2">
            <OrganizationOverviewMembersSection />
            <OrganizationOverviewInvitesSection />
         </div>
      </main>
   );
}

export function OrganizationPage() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationPageErrorFallback}>
         <Suspense fallback={<OrganizationPageSkeleton />}>
            <OrganizationContent />
         </Suspense>
      </ErrorBoundary>
   );
}

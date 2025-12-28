import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

// Error Fallback Component
function StatErrorFallback() {
   return (
      <StatsCard
         description="Failed to load statistic"
         title="Failed to load"
         value="0"
      />
   );
}

// Loading Skeleton Component
function StatSkeleton() {
   return (
      <Card className="col-span-1 h-full w-full">
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-24" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-32" />
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Skeleton className="h-10 w-16" />
         </CardContent>
      </Card>
   );
}

// Members Stat Component
function MembersStat() {
   const trpc = useTRPC();
   const { data: members } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationMembers.queryOptions(),
   );

   return (
      <StatsCard
         description={translate(
            "dashboard.routes.organization.stats-section.members-count.description",
         )}
         title={translate(
            "dashboard.routes.organization.stats-section.members-count.title",
         )}
         value={String(members?.length || 0)}
      />
   );
}

// Teams Stat Component
function TeamsStat() {
   const trpc = useTRPC();
   const { data: teams } = useSuspenseQuery(
      trpc.organization.listTeams.queryOptions(),
   );

   return (
      <StatsCard
         description={translate(
            "dashboard.routes.organization.stats-section.teams-count.description",
         )}
         title={translate(
            "dashboard.routes.organization.stats-section.teams-count.title",
         )}
         value={String(teams?.length || 0)}
      />
   );
}

// Authors Stat Component (replacing Projects)

export function OrganizationStats() {
   return (
      <div className="grid md:grid-cols-2 gap-4">
         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <MembersStat />
            </Suspense>
         </ErrorBoundary>

         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <TeamsStat />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}

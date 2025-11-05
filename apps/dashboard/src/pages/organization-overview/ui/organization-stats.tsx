import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { StatsCard } from "@packages/ui/components/stats-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function OrganizationStatsErrorFallback() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Organization Statistics</CardTitle>
            <CardDescription>
               Key metrics and statistics for your organization
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Error loading statistics</EmptyTitle>
                  <EmptyDescription>
                     Failed to load organization statistics. Please try again.
                  </EmptyDescription>
               </EmptyHeader>
               <EmptyContent>
                  <button
                     className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                     onClick={() => window.location.reload()}
                     type="button"
                  >
                     Retry
                  </button>
               </EmptyContent>
            </Empty>
         </CardContent>
      </Card>
   );
}

function OrganizationStatsSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Organization Statistics</CardTitle>
            <CardDescription>
               Key metrics and statistics for your organization
            </CardDescription>
         </CardHeader>
         <CardContent className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </CardContent>
      </Card>
   );
}

function OrganizationStatsContent() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.organization.getOverviewStats.queryOptions(),
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>Organization Statistics</CardTitle>
            <CardDescription>
               Key metrics and statistics for your organization
            </CardDescription>
         </CardHeader>
         <CardContent className="grid gap-4 md:grid-cols-2">
            <StatsCard
               description="The total number of members in the organization"
               title="Total Members"
               value={data.totalMembers}
            />
            <StatsCard
               description="The total number of writer agents in the organization"
               title="Total agents"
               value={data.totalAgents}
            />
         </CardContent>
      </Card>
   );
}

export function OrganizationStats() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationStatsErrorFallback}>
         <Suspense fallback={<OrganizationStatsSkeleton />}>
            <OrganizationStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}

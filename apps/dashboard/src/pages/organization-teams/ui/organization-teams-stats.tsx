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
import { Users, UserPlus, Activity, Settings } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function TeamsStatsContent() {
   const trpc = useTRPC();

   const { data: stats } = useSuspenseQuery(
      trpc.organizationTeams.getTeamStats.queryOptions(),
   );

   const statCards = [
      {
         description: "All organization teams",
         icon: <Users className="size-4" />,
         title: "Total Teams",
         value: stats.total,
         variant: "default" as const,
      },
      {
         description: "Active teams",
         icon: <Activity className="size-4" />,
         title: "Active Teams",
         value: stats.active,
         variant: "secondary" as const,
      },
      {
         description: "Total members across all teams",
         icon: <UserPlus className="size-4" />,
         title: "Team Members",
         value: stats.totalMembers,
         variant: "default" as const,
      },
      {
         description: "Teams with members",
         icon: <Settings className="size-4" />,
         title: "Configured Teams",
         value: stats.configured,
         variant: "default" as const,
      },
   ];

   return (
      <div className="grid h-min grid-cols-2 gap-4">
         {statCards.map((stat) => (
            <StatsCard
               description={stat.description}
               key={stat.title}
               title={stat.title}
               value={stat.value}
            />
         ))}
      </div>
   );
}

function TeamsStatsSkeleton() {
   return (
      <div className="grid h-min grid-cols-2 gap-4">
         {[1, 2, 3, 4].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`teams-stats-skeleton-card-${index + 1}`}
            >
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
         ))}
      </div>
   );
}

function TeamsStatsErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
            <CardDescription>Overview of all team metrics</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load team statistics
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function TeamsStats() {
   return (
      <ErrorBoundary FallbackComponent={TeamsStatsErrorFallback}>
         <Suspense fallback={<TeamsStatsSkeleton />}>
            <TeamsStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}


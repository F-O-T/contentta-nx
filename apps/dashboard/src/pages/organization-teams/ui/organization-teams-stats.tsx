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
import { Building2, Users, UserCheck, Activity } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function TeamsStatsContent() {
   const trpc = useTRPC();

   const { data: teams } = useSuspenseQuery(
      trpc.organization.listTeams.queryOptions(),
   );

   // Calculate statistics from teams data
   const totalTeams = teams?.length || 0;
   const totalMembers = teams?.reduce((sum, team) => sum + (team.memberCount || 0), 0) || 0;
   const activeTeams = teams?.filter(team => team.isActive !== false).length || 0;
   const averageMembers = totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0;

   const statCards = [
      {
         description: "All organization teams",
         icon: <Building2 className="size-4" />,
         title: "Total Teams",
         value: totalTeams,
         variant: "default" as const,
      },
      {
         description: "Currently active teams",
         icon: <Activity className="size-4" />,
         title: "Active Teams",
         value: activeTeams,
         variant: "secondary" as const,
      },
      {
         description: "Total team members",
         icon: <Users className="size-4" />,
         title: "Team Members",
         value: totalMembers,
         variant: "default" as const,
      },
      {
         description: "Average members per team",
         icon: <UserCheck className="size-4" />,
         title: "Avg Members",
         value: averageMembers,
         variant: "outline" as const,
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
               key={`stats-skeleton-card-${index + 1}`}
               className="col-span-1 h-full w-full"
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
            <CardDescription>
               Overview of all organization teams
            </CardDescription>
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
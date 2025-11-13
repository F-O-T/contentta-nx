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
import { Users, UserPlus, UserCheck, Shield } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function MembersStatsContent() {
   const trpc = useTRPC();

   const { data: membersData } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationMembers.queryOptions(),
   );

   const stats = {
      total: membersData.length,
      active: membersData.filter((member) => member.createdAt).length,
      members: membersData.filter((member) => member.role === "member").length,
      admins: membersData.filter((member) => member.role === "admin").length,
   };

   const statCards = [
      {
         description: "All organization members",
         icon: <Users className="size-4" />,
         title: "Total Members",
         value: stats.total,
         variant: "default" as const,
      },
      {
         description: "Active members",
         icon: <UserCheck className="size-4" />,
         title: "Active Members",
         value: stats.active,
         variant: "secondary" as const,
      },
      {
         description: "Users with Member Role",
         icon: <UserPlus className="size-4" />,
         title: "Members",
         value: stats.members,
         variant: "default" as const,
      },
      {
         description: "Admin members",
         icon: <Shield className="size-4" />,
         title: "Admins",
         value: stats.admins,
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

function MembersStatsSkeleton() {
   return (
      <div className="grid h-min grid-cols-2 gap-4">
         {[1, 2, 3, 4].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`members-stats-skeleton-card-${index + 1}`}
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

function MembersStatsErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Member Statistics</CardTitle>
            <CardDescription>Overview of all member metrics</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load member statistics
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function MembersStats() {
   return (
      <ErrorBoundary FallbackComponent={MembersStatsErrorFallback}>
         <Suspense fallback={<MembersStatsSkeleton />}>
            <MembersStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}


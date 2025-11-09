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
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function MembersStatsContent() {
   const trpc = useTRPC();

   const { data: organization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   // Calculate statistics from organization members data
   const members = organization?.members || [];
   const totalMembers = members.length;
   const activeMembers = members.filter(member =>
      member.user?.email // Members with valid email are considered active
   ).length;
   const adminMembers = members.filter(member =>
      member.role === "admin" || member.role === "owner"
   ).length;
   const regularMembers = totalMembers - adminMembers;

   const statCards = [
      {
         description: "All organization members",
         icon: <Users className="size-4" />,
         title: "Total Members",
         value: totalMembers,
         variant: "default" as const,
      },
      {
         description: "Members with admin privileges",
         icon: <Shield className="size-4" />,
         title: "Admin Members",
         value: adminMembers,
         variant: "secondary" as const,
      },
      {
         description: "Active regular members",
         icon: <UserCheck className="size-4" />,
         title: "Regular Members",
         value: regularMembers,
         variant: "default" as const,
      },
      {
         description: "Organization teams count",
         icon: <UserX className="size-4" />,
         title: "Teams Count",
         value: organization?.teams?.length || 0,
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

function MembersStatsSkeleton() {
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

function MembersStatsErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Member Statistics</CardTitle>
            <CardDescription>
               Overview of all organization members
            </CardDescription>
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
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
import { Clock, Mail, MailCheck, MailX } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function InvitesStatsContent() {
   const trpc = useTRPC();

   const { data: stats } = useSuspenseQuery(
      trpc.organizationInvites.getInvitationStats.queryOptions(),
   );

   const statCards = [
      {
         description: "All time invitations",
         icon: <Mail className="size-4" />,
         title: "Total Invites",
         value: stats.total,
         variant: "default" as const,
      },
      {
         description: "Awaiting response",
         icon: <Clock className="size-4" />,
         title: "Pending Invites",
         value: stats.pending,
         variant: "secondary" as const,
      },
      {
         description: "Successfully joined",
         icon: <MailCheck className="size-4" />,
         title: "Accepted Invites",
         value: stats.accepted,
         variant: "default" as const,
      },
      {
         description: "No longer valid",
         icon: <MailX className="size-4" />,
         title: "Expired Invites",
         value: stats.rejected,
         variant: "destructive" as const,
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

function InvitesStatsSkeleton() {
   return (
      <div className="grid h-min  grid-cols-2 gap-4">
         {[1, 2, 3, 4].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`stats-skeleton-card-${index + 1}`}
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

function InvitesStatsErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Invitation Statistics</CardTitle>
            <CardDescription>
               Overview of all invitation statuses
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load invitation statistics
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function InvitesStats() {
   return (
      <ErrorBoundary FallbackComponent={InvitesStatsErrorFallback}>
         <Suspense fallback={<InvitesStatsSkeleton />}>
            <InvitesStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}

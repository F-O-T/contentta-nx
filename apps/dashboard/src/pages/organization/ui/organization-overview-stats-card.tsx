import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Mail, Shield, Users } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function OrganizationStatsCardErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.organization.stats-card.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.organization.stats-card.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function OrganizationStatsCardSkeleton() {
   return (
      <Card>
         <CardHeader className="text-center">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-10 w-48 mx-auto" />
         </CardHeader>
         <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-20 w-full" />
            </div>
         </CardContent>
      </Card>
   );
}

function OrganizationStatsCardContent() {
   const trpc = useTRPC();
   const { activeOrganization } = useActiveOrganization();

   const { data: members } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationMembers.queryOptions(),
   );

   const { data: teams } = useSuspenseQuery(
      trpc.organizationTeams.listTeams.queryOptions(),
   );

   const { data: invitesData } = useSuspenseQuery(
      trpc.organizationInvites.listInvitations.queryOptions({
         limit: 100,
         offset: 0,
      }),
   );

   const pendingInvites = invitesData.invitations.filter(
      (inv) => inv.status === "pending",
   );
   const adminCount = members.filter(
      (m) => m.role === "admin" || m.role === "owner",
   ).length;

   return (
      <Card>
         <CardHeader className="text-center pb-2">
            <CardDescription>
               {translate("dashboard.routes.organization.stats-card.title")}
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
               {activeOrganization.name}
            </CardTitle>
         </CardHeader>
         <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                     <div className="flex items-center gap-2">
                        <div className="rounded-full bg-blue-500/10 p-2">
                           <Users className="size-4 text-blue-500" />
                        </div>
                        <CardDescription>
                           {translate(
                              "dashboard.routes.organization.stats-card.members",
                           )}
                        </CardDescription>
                     </div>
                     <CardTitle className="text-xl">{members.length}</CardTitle>
                  </CardHeader>
               </Card>

               <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                     <div className="flex items-center gap-2">
                        <div className="rounded-full bg-purple-500/10 p-2">
                           <Shield className="size-4 text-purple-500" />
                        </div>
                        <CardDescription>
                           {translate(
                              "dashboard.routes.organization.stats-card.admins",
                           )}
                        </CardDescription>
                     </div>
                     <CardTitle className="text-xl">{adminCount}</CardTitle>
                  </CardHeader>
               </Card>

               <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                     <div className="flex items-center gap-2">
                        <div className="rounded-full bg-green-500/10 p-2">
                           <Users className="size-4 text-green-500" />
                        </div>
                        <CardDescription>
                           {translate(
                              "dashboard.routes.organization.stats-card.teams",
                           )}
                        </CardDescription>
                     </div>
                     <CardTitle className="text-xl">{teams.length}</CardTitle>
                  </CardHeader>
               </Card>

               <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                     <div className="flex items-center gap-2">
                        <div className="rounded-full bg-amber-500/10 p-2">
                           <Mail className="size-4 text-amber-500" />
                        </div>
                        <CardDescription>
                           {translate(
                              "dashboard.routes.organization.stats-card.pending-invites",
                           )}
                        </CardDescription>
                     </div>
                     <CardTitle className="text-xl">
                        {pendingInvites.length}
                     </CardTitle>
                  </CardHeader>
               </Card>
            </div>
         </CardContent>
      </Card>
   );
}

export function OrganizationOverviewStatsCard() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationStatsCardErrorFallback}>
         <Suspense fallback={<OrganizationStatsCardSkeleton />}>
            <OrganizationStatsCardContent />
         </Suspense>
      </ErrorBoundary>
   );
}

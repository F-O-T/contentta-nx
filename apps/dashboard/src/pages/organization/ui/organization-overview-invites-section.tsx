import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
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
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDate } from "@packages/utils/date";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ArrowRight, Mail } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { RoleBadge } from "@/features/organization/ui/shared/role-badge";
import { StatusBadge } from "@/features/organization/ui/shared/status-badge";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function InvitesSectionCardHeader() {
   return (
      <CardHeader>
         <CardTitle>
            {translate("dashboard.routes.organization.recent-invites.title")}
         </CardTitle>
         <CardDescription>
            {translate(
               "dashboard.routes.organization.recent-invites.description",
            )}
         </CardDescription>
      </CardHeader>
   );
}

function OrganizationInvitesSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <InvitesSectionCardHeader />
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.organization.recent-invites.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.organization.recent-invites.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function OrganizationInvitesSectionSkeleton() {
   return (
      <Card className="w-full">
         <InvitesSectionCardHeader />
         <CardContent>
            <ItemGroup>
               {[1, 2, 3].map((index) => (
                  <Fragment key={`invite-skeleton-${index}`}>
                     <div className="flex items-center justify-between gap-4 py-2">
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-40" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                     </div>
                     {index !== 3 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function OrganizationInvitesSectionContent() {
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const { data: invitesData } = useSuspenseQuery(
      trpc.organizationInvites.listInvitations.queryOptions({
         limit: 5,
         offset: 0,
      }),
   );

   const { invitations: recentInvites, total } = invitesData;

   const handleViewAll = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/organization/invites",
      });
   };

   return (
      <Card className="w-full h-full">
         <InvitesSectionCardHeader />
         <CardContent className="space-y-4">
            {recentInvites.length === 0 ? (
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Mail className="size-8" />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.organization.recent-invites.state.empty.title",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.organization.recent-invites.state.empty.description",
                        )}
                     </EmptyDescription>
                  </EmptyContent>
               </Empty>
            ) : (
               <>
                  <ItemGroup>
                     {recentInvites.map((invite, index) => (
                        <Fragment key={invite.id}>
                           <div className="flex items-center gap-4 py-2">
                              <div className="flex-1 min-w-0">
                                 <p className="font-medium truncate">
                                    {invite.email}
                                 </p>
                                 <p className="text-sm text-muted-foreground">
                                    {translate(
                                       "dashboard.routes.organization.invites-table.columns.expires",
                                    )}
                                    :{" "}
                                    {formatDate(
                                       new Date(invite.expiresAt),
                                       "DD MMM YYYY",
                                    )}
                                 </p>
                              </div>
                              <RoleBadge role={invite.role} />
                              <StatusBadge status={invite.status} />
                           </div>
                           {index !== recentInvites.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     ))}
                  </ItemGroup>

                  {total > 5 && (
                     <Button
                        className="w-full"
                        onClick={handleViewAll}
                        variant="outline"
                     >
                        {translate(
                           "dashboard.routes.organization.recent-invites.view-all",
                        )}
                        <ArrowRight className="size-4 ml-2" />
                     </Button>
                  )}
               </>
            )}
         </CardContent>
      </Card>
   );
}

export function OrganizationOverviewInvitesSection() {
   return (
      <ErrorBoundary
         FallbackComponent={OrganizationInvitesSectionErrorFallback}
      >
         <Suspense fallback={<OrganizationInvitesSectionSkeleton />}>
            <OrganizationInvitesSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}

import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
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
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { RoleBadge } from "@/features/organization/ui/shared/role-badge";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function MembersSectionCardHeader() {
   return (
      <CardHeader>
         <CardTitle>
            {translate("dashboard.routes.organization.recent-members.title")}
         </CardTitle>
         <CardDescription>
            {translate(
               "dashboard.routes.organization.recent-members.description",
            )}
         </CardDescription>
      </CardHeader>
   );
}

function OrganizationMembersSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <MembersSectionCardHeader />
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.organization.recent-members.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.organization.recent-members.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function OrganizationMembersSectionSkeleton() {
   return (
      <Card className="w-full">
         <MembersSectionCardHeader />
         <CardContent>
            <ItemGroup>
               {[1, 2, 3].map((index) => (
                  <Fragment key={`member-skeleton-${index}`}>
                     <div className="flex items-center justify-between gap-4 py-2">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                        </div>
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

function OrganizationMembersSectionContent() {
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const { data: members } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationMembers.queryOptions(),
   );

   const recentMembers = members
      .sort(
         (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

   const handleViewAll = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/organization/members",
      });
   };

   return (
      <Card className="w-full h-full">
         <MembersSectionCardHeader />
         <CardContent className="space-y-4">
            {recentMembers.length === 0 ? (
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Users className="size-8" />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.organization.recent-members.state.empty.title",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.organization.recent-members.state.empty.description",
                        )}
                     </EmptyDescription>
                  </EmptyContent>
               </Empty>
            ) : (
               <>
                  <ItemGroup>
                     {recentMembers.map((member, index) => (
                        <Fragment key={member.id}>
                           <div className="flex items-center gap-4 py-2">
                              <Avatar className="size-10">
                                 {member.user.image && (
                                    <AvatarImage src={member.user.image} />
                                 )}
                                 <AvatarFallback>
                                    {getInitials(member.user.name)}
                                 </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                 <p className="font-medium truncate">
                                    {member.user.name}
                                 </p>
                                 <p className="text-sm text-muted-foreground truncate">
                                    {translate(
                                       "dashboard.routes.organization.recent-members.joined",
                                    )}{" "}
                                    {formatDate(
                                       new Date(member.createdAt),
                                       "DD MMM YYYY",
                                    )}
                                 </p>
                              </div>
                              <RoleBadge role={member.role} />
                           </div>
                           {index !== recentMembers.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     ))}
                  </ItemGroup>

                  {members.length > 5 && (
                     <Button
                        className="w-full"
                        onClick={handleViewAll}
                        variant="outline"
                     >
                        {translate(
                           "dashboard.routes.organization.recent-members.view-all",
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

export function OrganizationOverviewMembersSection() {
   return (
      <ErrorBoundary
         FallbackComponent={OrganizationMembersSectionErrorFallback}
      >
         <Suspense fallback={<OrganizationMembersSectionSkeleton />}>
            <OrganizationMembersSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}

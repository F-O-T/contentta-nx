import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

// Internal components for consistent localization
function RecentInvitesCardHeader() {
   return (
      <CardHeader className="">
         <CardTitle className="">
            {translate(
               "dashboard.routes.organization.recent-invites-section.title",
            )}
         </CardTitle>
         <CardDescription>
            {translate(
               "dashboard.routes.organization.recent-invites-section.description",
            )}
         </CardDescription>
      </CardHeader>
   );
}

function RecentInvitesContent() {
   const trpc = useTRPC();
   const { data: recentInvites } = useSuspenseQuery(
      trpc.organization.getRecentInvites.queryOptions(),
   );

   return (
      <Card>
         <RecentInvitesCardHeader />
         <CardContent>
            <ItemGroup>
               {recentInvites.map((invite, index) => (
                  <Fragment key={invite.id}>
                     <Item>
                        <ItemMedia className="size-10 " variant="icon">
                           <Mail className="size-4 " />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <ItemTitle>{invite.email}</ItemTitle>
                           <ItemDescription>{invite.role}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <Badge
                              variant={
                                 invite.status === "pending"
                                    ? "outline"
                                    : "default"
                              }
                           >
                              {invite.status}
                           </Badge>
                        </ItemActions>
                     </Item>
                     {index !== recentInvites.length - 1 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function RecentInvitesSkeleton() {
   return (
      <Card className="w-full">
         <RecentInvitesCardHeader />
         <CardContent>
            <ItemGroup>
               {[1, 2, 3].map((index) => (
                  <Fragment key={index}>
                     <Item>
                        <ItemMedia className="size-10" variant="icon">
                           <Mail className="size-4 " />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-3 w-32 mt-1" />
                        </ItemContent>
                        <ItemActions>
                           <Skeleton className="h-6 w-16" />
                        </ItemActions>
                     </Item>
                     {index !== 3 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function RecentInvitesErrorFallback({ error }: { error: Error }) {
   const ErrorFallbackComponent = createErrorFallback({
      errorDescription: translate(
         "dashboard.routes.organization.recent-invites-section.state.error.description",
      ),
      errorTitle: translate(
         "dashboard.routes.organization.recent-invites-section.state.error.title",
      ),
      retryText: translate("common.actions.retry"),
   });

   return (
      <Card className="w-full">
         <RecentInvitesCardHeader />
         <CardContent>
            <ErrorFallbackComponent
               error={error}
               resetErrorBoundary={() => {}}
            />
         </CardContent>
      </Card>
   );
}

// Export with Suspense and ErrorBoundary
export function RecentInvites() {
   return (
      <ErrorBoundary FallbackComponent={RecentInvitesErrorFallback}>
         <Suspense fallback={<RecentInvitesSkeleton />}>
            <RecentInvitesContent />
         </Suspense>
      </ErrorBoundary>
   );
}

import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
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
import { useRouter } from "@tanstack/react-router";
import { ChevronRight, Users } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function TeamsListContent() {
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const { data: teamsData } = useSuspenseQuery(
      trpc.organizationTeams.listTeams.queryOptions(),
   );

   const handleTeamClick = (teamId: string) => {
      router.navigate({
         params: { slug: activeOrganization.slug, teamId },
         to: "/$slug/organization/teams/$teamId",
      });
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Teams List</CardTitle>
            <CardDescription>
               Manage all your organization teams
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {teamsData.map((team, index) => (
                  <Fragment key={team.id}>
                     <Item
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleTeamClick(team.id)}
                     >
                        <ItemMedia className="size-10" variant="icon">
                           <Users className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="truncate">
                              {team.name}
                           </ItemTitle>
                           <ItemDescription>
                              {team.description ?? "No description"}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <Button
                              className="size-8"
                              size="icon"
                              variant="ghost"
                           >
                              <ChevronRight className="size-4" />
                           </Button>
                        </ItemActions>
                     </Item>
                     {index !== teamsData.length - 1 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function TeamsListSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Teams List</CardTitle>
            <CardDescription>
               Manage all your organization teams
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {[1, 2, 3, 4, 5].map((index) => (
                  <Fragment key={index}>
                     <Item>
                        <ItemMedia className="size-10" variant="icon">
                           <Users className="size-4" />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-3 w-32 mt-1" />
                        </ItemContent>
                        <ItemActions className="flex items-center gap-2">
                           <Skeleton className="h-6 w-16" />
                        </ItemActions>
                     </Item>
                     {index !== 5 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function TeamsListErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Teams List</CardTitle>
            <CardDescription>
               Manage all your organization teams
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load teams
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function TeamsListSection() {
   return (
      <ErrorBoundary FallbackComponent={TeamsListErrorFallback}>
         <Suspense fallback={<TeamsListSkeleton />}>
            <TeamsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}

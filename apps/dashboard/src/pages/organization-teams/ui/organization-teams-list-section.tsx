import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
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
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import {
   Edit,
   MoreVertical,
   Trash2,
   Users,
   UserPlus,
   Settings,
} from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

function TeamsListContent() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const { data: teamsData } = useSuspenseQuery(
      trpc.organizationTeams.listTeams.queryOptions(),
   );

   const deleteTeamMutation = useMutation(
      trpc.organizationTeams.deleteTeam.mutationOptions({
         onError: (error) => {
            toast.error(`Failed to delete team: ${error.message}`);
         },
         onSuccess: () => {
            toast.success("Team deleted successfully");
            queryClient.invalidateQueries({
               queryKey: trpc.organizationTeams.listTeams.queryKey(),
            });
         },
      }),
   );

   const handleDeleteTeam = async (teamId: string) => {
      await deleteTeamMutation.mutateAsync({ teamId });
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
                     <Item>
                        <ItemMedia className="size-10" variant="icon">
                           <Users className="size-4 " />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="truncate">
                              {team.name}
                           </ItemTitle>
                           <ItemDescription>{team.description}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button size="icon" variant="ghost">
                                    <MoreVertical className="size-4" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                 <DropdownMenuItem>
                                    Created:{" "}
                                    {new Date(
                                       team.createdAt,
                                    ).toLocaleDateString()}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    onClick={() => {
                                       // TODO: Implement edit team functionality
                                       toast.info(
                                          "Edit team functionality coming soon",
                                       );
                                    }}
                                 >
                                    <Edit className="size-4 mr-2" />
                                    Edit Team
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    onClick={() => {
                                       // TODO: Implement team settings functionality
                                       toast.info(
                                          "Team settings functionality coming soon",
                                       );
                                    }}
                                 >
                                    <Settings className="size-4 mr-2" />
                                    Team Settings
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteTeam(team.id)}
                                    disabled={deleteTeamMutation.isPending}
                                 >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Team
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
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

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
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@packages/ui/components/pagination";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDate } from "@packages/utils/date";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
   Building2,
   Calendar,
   Edit,
   MoreVertical,
   Settings,
   Trash2,
   Users,
} from "lucide-react";
import { Fragment, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { DeleteTeamDialog } from "../features/delete-team-dialog";
import { EditTeamSheet } from "../features/edit-team-sheet";

function TeamsListContent() {
   const trpc = useTRPC();
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);
   const [editingTeam, setEditingTeam] = useState<any>(null);
   const [deletingTeam, setDeletingTeam] = useState<any>(null);
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

   const { data: teams } = useSuspenseQuery(
      trpc.organization.listTeams.queryOptions(),
   );

   // Simple pagination for client-side data
   const paginatedTeams = teams.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
   );

   const handleEditTeam = (team: any) => {
      setEditingTeam(team);
      setIsEditSheetOpen(true);
   };

   const handleDeleteTeam = (team: any) => {
      setDeletingTeam(team);
      setIsDeleteDialogOpen(true);
   };

   return (
      <>
         <Card className="w-full">
            <CardHeader>
               <CardTitle>Teams List</CardTitle>
               <CardDescription>
                  Manage all your organization teams
               </CardDescription>
            </CardHeader>
            <CardContent>
               <ItemGroup>
                  {paginatedTeams.length > 0 ? (
                     paginatedTeams.map((team, index) => (
                        <Fragment key={team.id}>
                           <Item>
                              <ItemMedia variant="icon" className="size-10">
                                 <Building2 className="size-4" />
                              </ItemMedia>
                              <ItemContent className="gap-1">
                                 <ItemTitle>{team.name}</ItemTitle>
                                 <ItemDescription className="flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                       <Users className="size-3" />
                                       {team.memberCount || 0} members
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                       <Calendar className="size-3" />
                                       {team.createdAt
                                          ? formatDate(team.createdAt)
                                          : "No date"}
                                    </span>
                                 </ItemDescription>
                              </ItemContent>
                              <ItemActions className="flex items-center gap-2">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                       <Button size="icon" variant="ghost">
                                          <MoreVertical className="size-4" />
                                       </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                       <DropdownMenuItem
                                          onClick={() => handleEditTeam(team)}
                                       >
                                          <Edit className="size-4 mr-2" />
                                          Edit Team
                                       </DropdownMenuItem>
                                       <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => handleDeleteTeam(team)}
                                       >
                                          <Trash2 className="size-4 mr-2" />
                                          Delete Team
                                       </DropdownMenuItem>
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                              </ItemActions>
                           </Item>
                           {index !== paginatedTeams.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     ))
                  ) : (
                     <div className="text-center py-8">
                        <Building2 className="size-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                           No teams found
                        </h3>
                        <p className="text-muted-foreground mb-4">
                           Get started by creating your first team
                        </p>
                     </div>
                  )}
               </ItemGroup>
            </CardContent>
            {teams.length > pageSize && (
               <CardFooter>
                  <Pagination>
                     <PaginationContent>
                        <PaginationItem>
                           <PaginationPrevious
                              className={
                                 currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                              }
                              onClick={() =>
                                 setCurrentPage(Math.max(1, currentPage - 1))
                              }
                           />
                        </PaginationItem>
                        {Array.from(
                           { length: Math.ceil(teams.length / pageSize) },
                           (_, i) => i + 1,
                        ).map((page) => (
                           <PaginationItem key={page}>
                              <PaginationLink
                                 className="cursor-pointer"
                                 isActive={currentPage === page}
                                 onClick={() => setCurrentPage(page)}
                              >
                                 {page}
                              </PaginationLink>
                           </PaginationItem>
                        ))}
                        <PaginationItem>
                           <PaginationNext
                              className={
                                 currentPage ===
                                 Math.ceil(teams.length / pageSize)
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                              }
                              onClick={() =>
                                 setCurrentPage(
                                    Math.min(
                                       Math.ceil(teams.length / pageSize),
                                       currentPage + 1,
                                    ),
                                 )
                              }
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </CardFooter>
            )}
         </Card>

         <EditTeamSheet
            onOpenChange={setIsEditSheetOpen}
            open={isEditSheetOpen}
            team={editingTeam}
         />

         <DeleteTeamDialog
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
            team={deletingTeam}
         />
      </>
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
                        <ItemMedia variant="icon" className="size-10">
                           <Building2 className="size-4 " />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-3 w-32 mt-1" />
                        </ItemContent>
                        <ItemActions className="flex items-center gap-2">
                           <Skeleton className="h-6 w-16" />
                           <div className="flex gap-1">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                           </div>
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

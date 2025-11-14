import type { AgentSelect } from "@packages/database/schema";
import type { PersonaConfig } from "@packages/database/schemas/agent";
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
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Edit, Eye, MoreHorizontal, PlusIcon, Trash2 } from "lucide-react";
import { Fragment, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DeleteAgentDialog } from "@/features/agent-actions/ui/delete-agent-dialog";
import { EditAgentAction } from "@/features/agent-actions/ui/edit-agent-action";
import { useTRPC } from "@/integrations/clients";
import { useAgentList } from "../features/agent-list-context";

type AgentListItemProps = {
   agent: AgentSelect;
};

function AgentListItem({ agent }: AgentListItemProps) {
   const trpc = useTRPC();
   const { selectedItems, handleSelectionChange } = useAgentList();
   const navigate = useNavigate();
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

   const { data: profilePhoto } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: agent.id,
      }),
   );

   const personaConfig = agent.personaConfig as PersonaConfig;

   const { handleEdit } = EditAgentAction({ agentId: agent.id });

   const handleViewDetails = () => {
      navigate({
         params: { agentId: agent.id },
         to: "/agents/$agentId",
      });
   };

   const handleViewContent = () => {
      navigate({
         params: { agentId: agent.id },
         to: "/agents/$agentId/content/request",
      });
   };

   const handleEditAgent = () => {
      handleEdit();
   };

   const handleDelete = () => {
      setDeleteDialogOpen(true);
   };

   const dropdownItems = [
      {
         icon: <Eye className="h-4 w-4" />,
         label: translate("pages.agent-details.quick-actions.view-details"),
         onClick: handleViewDetails,
      },
      {
         icon: <PlusIcon className="h-4 w-4" />,
         label: translate("pages.agent-details.quick-actions.create-content"),
         onClick: handleViewContent,
      },
      {
         icon: <Edit className="h-4 w-4" />,
         label: translate("pages.agent-details.quick-actions.edit-agent"),
         onClick: handleEditAgent,
      },
      {
         destructive: true,
         icon: <Trash2 className="h-4 w-4" />,
         label: translate("pages.agent-details.quick-actions.delete-agent"),
         onClick: handleDelete,
      },
   ];

   return (
      <>
         <Item>
            <ItemMedia className="group relative">
               <Avatar className="size-10">
                  <AvatarImage
                     alt={personaConfig.metadata.name}
                     src={
                        profilePhoto
                           ? `data:image/jpeg;base64,${profilePhoto.data}`
                           : undefined
                     }
                  />
                  <AvatarFallback>
                     {personaConfig.metadata.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
               </Avatar>
               <div
                  className={`absolute -top-1 -right-1 transition-opacity ${
                     selectedItems.has(agent.id)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                  }`}
               >
                  <Checkbox
                     checked={selectedItems.has(agent.id)}
                     className="size-4 border-2 border-background"
                     onCheckedChange={(checked) =>
                        handleSelectionChange(agent.id, checked as boolean)
                     }
                  />
               </div>
            </ItemMedia>
            <ItemContent>
               <ItemTitle className="truncate">
                  {personaConfig.metadata.name}
               </ItemTitle>
               <ItemDescription className="truncate">
                  {personaConfig.metadata.description}
               </ItemDescription>
            </ItemContent>
            <ItemActions>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     {dropdownItems.map((item, index) => (
                        <Fragment key={item.label}>
                           <DropdownMenuItem
                              className={
                                 item.destructive ? "text-destructive" : ""
                              }
                              onClick={item.onClick}
                           >
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                           </DropdownMenuItem>
                           {index < dropdownItems.length - 1 && (
                              <DropdownMenuSeparator />
                           )}
                        </Fragment>
                     ))}
                  </DropdownMenuContent>
               </DropdownMenu>
            </ItemActions>
         </Item>
         <DeleteAgentDialog
            agentId={agent.id}
            agentName={personaConfig.metadata.name}
            onOpenChange={setDeleteDialogOpen}
            open={deleteDialogOpen}
         />
      </>
   );
}

function AgentListContent() {
   const trpc = useTRPC();
   const { page, limit, totalPages, handlePageChange } = useAgentList();

   const { data } = useSuspenseQuery(
      trpc.agent.list.queryOptions({ limit, page }),
   );

   const hasAgents = data?.items && data.items.length > 0;

   if (!hasAgents) {
      return null;
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Agents List</CardTitle>
            <CardDescription>Manage all your AI agents</CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {data.items.map((agent, index) => (
                  <Fragment key={agent.id}>
                     <Suspense
                        fallback={
                           <Item>
                              <ItemMedia className="group relative">
                                 <Skeleton className="size-10 rounded-full" />
                                 <Skeleton className="absolute -top-1 -right-1 size-4 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                              </ItemMedia>
                              <ItemContent className="gap-1">
                                 <Skeleton className="h-4 w-32" />
                                 <Skeleton className="h-3 w-48" />
                              </ItemContent>
                              <ItemActions>
                                 <Skeleton className="size-8" />
                              </ItemActions>
                           </Item>
                        }
                     >
                        <AgentListItem agent={agent} />
                     </Suspense>
                     {index !== data.items.length - 1 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
         {totalPages > 1 && (
            <CardFooter>
               <Pagination>
                  <PaginationContent>
                     <PaginationItem>
                        <PaginationPrevious
                           className={
                              page === 1
                                 ? "pointer-events-none opacity-50"
                                 : "cursor-pointer"
                           }
                           onClick={() => handlePageChange(page - 1)}
                        />
                     </PaginationItem>
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => (
                           <PaginationItem key={pageNum}>
                              <PaginationLink
                                 className="cursor-pointer"
                                 isActive={page === pageNum}
                                 onClick={() => handlePageChange(pageNum)}
                              >
                                 {pageNum}
                              </PaginationLink>
                           </PaginationItem>
                        ),
                     )}
                     <PaginationItem>
                        <PaginationNext
                           className={
                              page === totalPages
                                 ? "pointer-events-none opacity-50"
                                 : "cursor-pointer"
                           }
                           onClick={() => handlePageChange(page + 1)}
                        />
                     </PaginationItem>
                  </PaginationContent>
               </Pagination>
            </CardFooter>
         )}
      </Card>
   );
}

function AgentListErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Agents List</CardTitle>
            <CardDescription>Manage all your AI agents</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load agents
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function AgentListSection() {
   return (
      <ErrorBoundary FallbackComponent={AgentListErrorFallback}>
         <Suspense
            fallback={
               <Card>
                  <CardHeader>
                     <CardTitle>Agents List</CardTitle>
                     <CardDescription>
                        Manage all your AI agents
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <ItemGroup>
                        {[1, 2, 3, 4, 5].map((index) => (
                           <Fragment key={index}>
                              <Item>
                                 <ItemMedia className="group relative">
                                    <Skeleton className="size-10 rounded-full" />
                                    <Skeleton className="absolute -top-1 -right-1 size-4 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </ItemMedia>
                                 <ItemContent className="gap-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                 </ItemContent>
                                 <ItemActions>
                                    <Skeleton className="size-8" />
                                 </ItemActions>
                              </Item>
                              {index !== 5 && <ItemSeparator />}
                           </Fragment>
                        ))}
                     </ItemGroup>
                  </CardContent>
                  <CardFooter>
                     <Pagination>
                        <PaginationContent>
                           <PaginationItem>
                              <PaginationPrevious className="pointer-events-none opacity-50" />
                           </PaginationItem>
                           {[1, 2, 3, 4, 5].map((pageNum) => (
                              <PaginationItem key={pageNum}>
                                 <PaginationLink isActive={pageNum === 1}>
                                    {pageNum}
                                 </PaginationLink>
                              </PaginationItem>
                           ))}
                           <PaginationItem>
                              <PaginationNext className="pointer-events-none opacity-50" />
                           </PaginationItem>
                        </PaginationContent>
                     </Pagination>
                  </CardFooter>
               </Card>
            }
         >
            <AgentListContent />
         </Suspense>
      </ErrorBoundary>
   );
}

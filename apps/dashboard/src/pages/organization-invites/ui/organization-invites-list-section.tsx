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
   Calendar,
   Clock,
   Mail,
   MailCheck,
   MailX,
   MoreVertical,
   RefreshCw,
   Settings,
   Trash2,
} from "lucide-react";
import { Fragment, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

function InvitesListContent() {
   const trpc = useTRPC();
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

   const { data: invitesData } = useSuspenseQuery(
      trpc.organizationInvites.listInvitations.queryOptions({
         limit: pageSize,
         offset: (currentPage - 1) * pageSize,
      }),
   );

   const resendInviteMutation = useMutation(
      trpc.organization.createInvitation.mutationOptions({
         onError: (error) => {
            toast.error(`Failed to resend invitation: ${error.message}`);
         },
         onSuccess: () => {
            toast.success("Invitation resent successfully");
         },
      }),
   );

   const handleResendInvite = async (invite: any) => {
      await resendInviteMutation.mutateAsync({
         email: invite.email,
         resend: true,
         role: invite.role.toLowerCase() as "member" | "admin" | "owner",
      });
   };

   const handleRevokeInvite = (inviteId: string) => {
      // TODO: Implement revoke invite logic - no revoke API available yet
      toast.info("Revoke functionality not yet implemented");
      console.log("Revoke invite:", inviteId);
   };

   const handlePageSizeChange = (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1); // Reset to first page when changing page size
   };

   const getStatusIcon = (status: string) => {
      switch (status) {
         case "pending":
            return <Clock className="size-4" />;
         case "accepted":
            return <MailCheck className="size-4" />;
         case "expired":
            return <MailX className="size-4" />;
         case "revoked":
            return <MailX className="size-4" />;
         default:
            return <Mail className="size-4" />;
      }
   };

   return (
      <Card className="w-full">
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>Invites List</CardTitle>
                  <CardDescription>
                     Manage all your organization invitation requests
                  </CardDescription>
               </div>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost">
                        <Settings className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => handlePageSizeChange(5)}>
                        5 items per page
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handlePageSizeChange(10)}>
                        10 items per page
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handlePageSizeChange(20)}>
                        20 items per page
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handlePageSizeChange(50)}>
                        50 items per page
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {invitesData.invitations.map((invite, index) => (
                  <Fragment key={invite.id}>
                     <Item>
                        <ItemMedia className="size-10 rounded-full bg-muted flex items-center justify-center">
                           {getStatusIcon(invite.status)}
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <ItemTitle>{invite.email}</ItemTitle>
                           <ItemDescription className="flex items-center gap-2">
                              <span>{invite.role}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                 <Calendar className="size-3" />
                                 {formatDate(invite.expiresAt)}
                              </span>
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions className="flex items-center gap-2">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button
                                    disabled={invite.status === "accepted"}
                                    size="icon"
                                    variant="ghost"
                                 >
                                    <MoreVertical className="size-4" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                 <DropdownMenuItem className="text-xs text-muted-foreground">
                                    Status: {invite.status}
                                 </DropdownMenuItem>
                                 {invite.status === "pending" && (
                                    <>
                                       <DropdownMenuItem
                                          disabled={
                                             resendInviteMutation.isPending
                                          }
                                          onClick={() =>
                                             handleResendInvite(invite)
                                          }
                                       >
                                          <RefreshCw className="size-4 mr-2" />
                                          Resend Invitation
                                       </DropdownMenuItem>
                                       <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() =>
                                             handleRevokeInvite(invite.id)
                                          }
                                       >
                                          <Trash2 className="size-4 mr-2" />
                                          Revoke Invitation
                                       </DropdownMenuItem>
                                    </>
                                 )}
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </ItemActions>
                     </Item>
                     {index !== invitesData.invitations.length - 1 && (
                        <ItemSeparator />
                     )}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
         {invitesData.total > pageSize && (
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
                        { length: Math.ceil(invitesData.total / pageSize) },
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
                                 Math.ceil(invitesData.total / pageSize)
                                 ? "pointer-events-none opacity-50"
                                 : "cursor-pointer"
                           }
                           onClick={() =>
                              setCurrentPage(
                                 Math.min(
                                    Math.ceil(invitesData.total / pageSize),
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
   );
}

function InvitesListSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Invites List</CardTitle>
            <CardDescription>
               Manage all your organization invitation requests
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {[1, 2, 3, 4, 5].map((index) => (
                  <Fragment key={index}>
                     <Item>
                        <ItemMedia>
                           <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                              <Mail className="size-4 text-muted-foreground" />
                           </div>
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

function InvitesListErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Invites List</CardTitle>
            <CardDescription>
               Manage all your organization invitation requests
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load invitations
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function InvitesListSection() {
   return (
      <ErrorBoundary FallbackComponent={InvitesListErrorFallback}>
         <Suspense fallback={<InvitesListSkeleton />}>
            <InvitesListContent />
         </Suspense>
      </ErrorBoundary>
   );
}

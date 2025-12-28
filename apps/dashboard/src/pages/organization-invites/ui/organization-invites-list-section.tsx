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
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   Clock,
   Mail,
   MailCheck,
   MailX,
   MoreVertical,
   RefreshCw,
   Trash2,
} from "lucide-react";
import { Fragment, Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

function InvitesListContent() {
   const trpc = useTRPC();
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize] = useState(10);
   const [isResending, setIsResending] = useState(false);
   const { data: invitesData } = useSuspenseQuery(
      trpc.organizationInvites.listInvitations.queryOptions({
         limit: pageSize,
         offset: (currentPage - 1) * pageSize,
      }),
   );

   const inviteMember = useCallback(
      async (data: { email: string; role: "member" | "admin" | "owner" }) => {
         await betterAuthClient.organization.inviteMember(
            {
               email: data.email,
               role: data.role,
            },
            {
               onRequest: () => {
                  setIsResending(true);
                  toast.loading("Sending invitation...");
               },
               onSuccess: () => {
                  setIsResending(false);
                  toast.success("Invitation sent successfully");
               },
               onError: (ctx) => {
                  setIsResending(false);
                  toast.error(ctx.error.message || "Failed to send invitation");
               },
            },
         );
      },
      [],
   );

   const revokeInvitation = useCallback(async (invitationId: string) => {
      await betterAuthClient.organization.cancelInvitation(
         {
            invitationId,
         },
         {
            onRequest: () => {
               toast.loading("Revoking invitation...");
            },
            onSuccess: () => {
               toast.success("Invitation revoked successfully");
            },
            onError: (ctx) => {
               toast.error(ctx.error.message || "Failed to revoke invitation");
            },
         },
      );
   }, []);

   const handleResendInvite = async (
      invite: (typeof invitesData)["invitations"][number],
   ) => {
      await inviteMember({
         email: invite.email,
         role: invite.role.toLowerCase() as "member" | "admin" | "owner",
      });
   };

   const handleRevokeInvite = async (inviteId: string) => {
      await revokeInvitation(inviteId);
   };

   const getStatusIcon = (status: string) => {
      switch (status) {
         case "pending":
            return <Clock className="size-4" />;
         case "accepted":
            return <MailCheck className="size-4" />;
         case "expired":
            return <MailX className="size-4" />;
         case "canceled":
            return <MailX className="size-4" />;
         default:
            return <Mail className="size-4" />;
      }
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Invites List</CardTitle>
            <CardDescription>
               Manage all your organization invitation requests
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {invitesData.invitations.map((invite, index) => (
                  <Fragment key={invite.id}>
                     <Item>
                        <ItemMedia className="size-10 " variant="icon">
                           {getStatusIcon(invite.status)}
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="truncate">
                              {invite.email}
                           </ItemTitle>
                           <ItemDescription>{invite.role}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
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
                                 <DropdownMenuItem>
                                    Status: {invite.status}
                                 </DropdownMenuItem>
                                 {invite.status === "pending" && (
                                    <>
                                       <DropdownMenuItem
                                          disabled={isResending}
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
                        <ItemMedia className="size-10 " variant="icon">
                           <Mail className="size-4 " />
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

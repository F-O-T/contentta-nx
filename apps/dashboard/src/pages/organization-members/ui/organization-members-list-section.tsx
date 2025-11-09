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
import { Badge } from "@packages/ui/components/badge";
import { formatDate } from "@packages/utils/date";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getInitials } from "@packages/utils/text";
import {
   Calendar,
   Edit,
   MoreVertical,
   Settings,
   Shield,
   User,
   UserX,
   UserCheck,
   Mail,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { MemberRoleManagementDialog } from "../features/member-role-management-dialog";
import { RemoveMemberDialog } from "../features/remove-member-dialog";

function MembersListContent() {
   const trpc = useTRPC();
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);
   const [editingMember, setEditingMember] = useState<any>(null);
   const [removingMember, setRemovingMember] = useState<any>(null);
   const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
   const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

   const { data: organization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const members = organization?.members || [];

   // Simple pagination for client-side data
   const paginatedMembers = members.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
   );

   const handleEditRole = (member: any) => {
      setEditingMember(member);
      setIsRoleDialogOpen(true);
   };

   const handleRemoveMember = (member: any) => {
      setRemovingMember(member);
      setIsRemoveDialogOpen(true);
   };

   const handlePageSizeChange = (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1); // Reset to first page when changing page size
   };

   const getRoleIcon = (role: string) => {
      switch (role.toLowerCase()) {
         case "owner":
            return <Shield className="size-4" />;
         case "admin":
            return <UserCheck className="size-4" />;
         case "member":
            return <User className="size-4" />;
         default:
            return <User className="size-4" />;
      }
   };

   const getRoleBadgeVariant = (role: string) => {
      switch (role.toLowerCase()) {
         case "owner":
            return "destructive" as const;
         case "admin":
            return "default" as const;
         case "member":
            return "secondary" as const;
         default:
            return "outline" as const;
      }
   };

   return (
      <>
         <Card className="w-full">
            <CardHeader>
               <div className="flex items-center justify-between">
                  <div>
                     <CardTitle>Members List</CardTitle>
                     <CardDescription>
                        Manage all your organization members and their roles
                     </CardDescription>
                  </div>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                           <Settings className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem
                           onClick={() => handlePageSizeChange(5)}
                        >
                           5 items per page
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() => handlePageSizeChange(10)}
                        >
                           10 items per page
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() => handlePageSizeChange(20)}
                        >
                           20 items per page
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() => handlePageSizeChange(50)}
                        >
                           50 items per page
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </CardHeader>
            <CardContent>
               <ItemGroup>
                  {paginatedMembers.length > 0 ? (
                     paginatedMembers.map((member, index) => (
                        <Fragment key={member.id}>
                           <Item>
                              <ItemMedia>
                                 <Avatar className="size-10">
                                    <AvatarImage
                                       src={member.user?.image || undefined}
                                       alt={member.user?.name || "Avatar"}
                                    />
                                    <AvatarFallback>
                                       {getInitials(
                                          member.user?.name ||
                                             member.user?.email ||
                                             "Unknown",
                                       )}
                                    </AvatarFallback>
                                 </Avatar>
                              </ItemMedia>
                              <ItemContent className="gap-1">
                                 <ItemTitle className="flex items-center gap-2">
                                    {member.user?.name || "Unknown User"}
                                    <Badge
                                       variant={getRoleBadgeVariant(
                                          member.role || "member",
                                       )}
                                    >
                                       {getRoleIcon(member.role || "member")}
                                       <span className="ml-1">
                                          {member.role || "member"}
                                       </span>
                                    </Badge>
                                 </ItemTitle>
                                 <ItemDescription className="flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                       <Mail className="size-3" />
                                       {member.user?.email || "No email"}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                       <Calendar className="size-3" />
                                       {member.createdAt
                                          ? formatDate(member.createdAt)
                                          : "Unknown"}
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
                                          onClick={() => handleEditRole(member)}
                                       >
                                          <Edit className="size-4 mr-2" />
                                          Change Role
                                       </DropdownMenuItem>
                                       <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() =>
                                             handleRemoveMember(member)
                                          }
                                       >
                                          <UserX className="size-4 mr-2" />
                                          Remove Member
                                       </DropdownMenuItem>
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                              </ItemActions>
                           </Item>
                           {index !== paginatedMembers.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     ))
                  ) : (
                     <div className="text-center py-8">
                        <User className="size-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                           No members found
                        </h3>
                        <p className="text-muted-foreground mb-4">
                           Invite members to join your organization
                        </p>
                     </div>
                  )}
               </ItemGroup>
            </CardContent>
            {members.length > pageSize && (
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
                           { length: Math.ceil(members.length / pageSize) },
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
                                 Math.ceil(members.length / pageSize)
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                              }
                              onClick={() =>
                                 setCurrentPage(
                                    Math.min(
                                       Math.ceil(members.length / pageSize),
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

         <MemberRoleManagementDialog
            onOpenChange={setIsRoleDialogOpen}
            open={isRoleDialogOpen}
            member={editingMember}
         />

         <RemoveMemberDialog
            onOpenChange={setIsRemoveDialogOpen}
            open={isRemoveDialogOpen}
            member={removingMember}
         />
      </>
   );
}

function MembersListSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Members List</CardTitle>
            <CardDescription>
               Manage all your organization members and their roles
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {[1, 2, 3, 4, 5].map((index) => (
                  <Fragment key={index}>
                     <Item>
                        <ItemMedia>
                           <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="size-4 text-muted-foreground" />
                           </div>
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48 mt-1" />
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

function MembersListErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Members List</CardTitle>
            <CardDescription>
               Manage all your organization members and their roles
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load members
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function MembersListSection() {
   return (
      <ErrorBoundary FallbackComponent={MembersListErrorFallback}>
         <Suspense fallback={<MembersListSkeleton />}>
            <MembersListContent />
         </Suspense>
      </ErrorBoundary>
   );
}

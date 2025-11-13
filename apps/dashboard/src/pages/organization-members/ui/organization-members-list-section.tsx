import { AvatarFallback, Avatar } from "@packages/ui/components/avatar";
import { getInitials } from "@packages/utils/text";
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
import { Mail } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { Badge } from "@packages/ui/components/badge";

function MembersListContent() {
   const trpc = useTRPC();

   const { data: membersData } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationMembers.queryOptions(),
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>Members List</CardTitle>
            <CardDescription>
               Manage all your organization members
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {membersData.map((member, index) => (
                  <Fragment key={member.id}>
                     <Item>
                        <ItemMedia className="size-10">
                           <Avatar>
                              <AvatarFallback>
                                 {getInitials(member.user.name)}
                              </AvatarFallback>
                           </Avatar>
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="truncate">
                              {member.user.name}
                           </ItemTitle>
                           <ItemDescription className="flex items-center gap-2">
                              {member.user.email}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           {member.role && <Badge>{member.role}</Badge>}
                        </ItemActions>
                     </Item>
                     {index !== membersData.length - 1 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function MembersListSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Members List</CardTitle>
            <CardDescription>
               Manage all your organization members
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {[1, 2, 3, 4, 5].map((index) => (
                  <Fragment key={index}>
                     <Item>
                        <ItemMedia className="size-10">
                           <Skeleton className="size-10 rounded-full" />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-32" />
                           <div className="flex items-center gap-2">
                              <Mail className="size-3" />
                              <Skeleton className="h-3 w-48" />
                           </div>
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

function MembersListErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Members List</CardTitle>
            <CardDescription>
               Manage all your organization members
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


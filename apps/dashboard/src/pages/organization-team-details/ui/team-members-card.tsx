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
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
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
import { MoreHorizontal, UserMinus, UserPlus, Users } from "lucide-react";
import { Fragment, useCallback, useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { betterAuthClient } from "@/integrations/clients";

interface Member {
   id: string;
   userId: string;
   user?: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
   };
}

interface TeamMembersCardProps {
   teamId: string;
   members: Member[];
}

export function TeamMembersCard({ teamId, members }: TeamMembersCardProps) {
   const { openAlertDialog } = useAlertDialog();
   const [isPending, setIsPending] = useState(false);

   const removeTeamMember = useCallback(
      async (data: { teamId: string; userId: string }) => {
         await betterAuthClient.organization.removeTeamMember(
            {
               teamId: data.teamId,
               userId: data.userId,
            },
            {
               onRequest: () => {
                  setIsPending(true);
                  toast.loading("Removing team member...");
               },
               onSuccess: () => {
                  setIsPending(false);
                  toast.success("Team member removed successfully");
               },
               onError: (ctx) => {
                  setIsPending(false);
                  toast.error(
                     ctx.error.message || "Failed to remove team member",
                  );
               },
            },
         );
      },
      [],
   );

   const handleRemoveMember = (member: Member) => {
      openAlertDialog({
         actionLabel: "Remove Member",
         description: `Are you sure you want to remove ${member.user?.name || member.user?.email} from this team?`,
         onAction: async () => {
            await removeTeamMember({
               teamId,
               userId: member.userId,
            });
         },
         title: "Remove Team Member",
         variant: "destructive",
      });
   };

   if (members.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Team Members</CardTitle>
               <CardDescription>Members in this team</CardDescription>
            </CardHeader>
            <CardContent>
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Users className="size-8 text-muted-foreground" />
                     </EmptyMedia>
                     <EmptyTitle>No members yet</EmptyTitle>
                     <EmptyDescription>
                        Add members to this team to collaborate
                     </EmptyDescription>
                     <Button className="mt-4" size="sm" variant="outline">
                        <UserPlus className="size-4 mr-2" />
                        Add Member
                     </Button>
                  </EmptyContent>
               </Empty>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle>Team Members</CardTitle>
               <CardDescription>
                  {members.length} member{members.length !== 1 ? "s" : ""} in
                  this team
               </CardDescription>
            </div>
            <Button size="sm" variant="outline">
               <UserPlus className="size-4 mr-2" />
               Add Member
            </Button>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {members.map((member, index) => (
                  <Fragment key={member.id}>
                     <Item>
                        <ItemMedia>
                           <Avatar className="size-10">
                              <AvatarImage
                                 alt={member.user?.name || "Member"}
                                 src={member.user?.image || undefined}
                              />
                              <AvatarFallback>
                                 {(
                                    member.user?.name ||
                                    member.user?.email ||
                                    "?"
                                 )
                                    .charAt(0)
                                    .toUpperCase()}
                              </AvatarFallback>
                           </Avatar>
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>
                              {member.user?.name || "Unknown User"}
                           </ItemTitle>
                           <ItemDescription>
                              {member.user?.email || "No email"}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button
                                    className="size-8"
                                    disabled={isPending}
                                    size="icon"
                                    variant="ghost"
                                 >
                                    <MoreHorizontal className="size-4" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                 <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleRemoveMember(member)}
                                 >
                                    <UserMinus className="size-4 mr-2" />
                                    Remove from team
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </ItemActions>
                     </Item>
                     {index !== members.length - 1 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

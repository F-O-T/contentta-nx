import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getInitials } from "@packages/utils/text";
import { AlertTriangle, Shield, User, UserCheck, UserX } from "lucide-react";
import type { FC } from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface RemoveMemberDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   member?: any;
}

const getRoleIcon = (role: string) => {
   switch (role.toLowerCase()) {
      case "owner":
         return <Shield className="size-3" />;
      case "admin":
         return <UserCheck className="size-3" />;
      case "member":
         return <User className="size-3" />;
      default:
         return <User className="size-3" />;
   }
};

export const RemoveMemberDialog: FC<RemoveMemberDialogProps> = ({
   open,
   onOpenChange,
   member,
}) => {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Placeholder mutation - will need to be connected to actual API
   const removeMemberMutation = useMutation({
      mutationFn: async (memberId: string) => {
         // TODO: Implement actual member removal API call
         // For now, just simulate a delay
         await new Promise((resolve) => setTimeout(resolve, 1000));
         return { success: true };
      },
      onError: (error) => {
         console.error("Failed to remove member", error);
         toast.error("Failed to remove member. Please try again.");
      },
      onSuccess: async () => {
         toast.success(
            `Member "${member?.user?.name || member?.user?.email}" removed successfully`,
         );
         // Invalidate organization data to refresh the members list
         await queryClient.invalidateQueries({
            queryKey: trpc.organization.getActiveOrganization.queryKey(),
         });
         onOpenChange(false);
      },
   });

   const handleRemove = useCallback(() => {
      if (!member?.id) {
         toast.error("No member selected for removal");
         return;
      }
      removeMemberMutation.mutate(member.id);
   }, [removeMemberMutation, member]);

   const isOwner = member?.role?.toLowerCase() === "owner";

   return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle className="flex items-center gap-2">
                  <UserX className="size-5" />
                  Remove Member
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {member ? (
                     <>
                        Are you sure you want to remove{" "}
                        <strong>
                           {member.user?.name || member.user?.email}
                        </strong>{" "}
                        from the organization?
                     </>
                  ) : (
                     "No member selected for removal."
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>

            {member && (
               <div className="py-4">
                  <div className="flex items-center gap-3 mb-4">
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
                     <div className="flex-1">
                        <div className="font-medium">
                           {member.user?.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                           {member.user?.email}
                        </div>
                        <div className="mt-1">
                           <Badge variant="outline" className="text-xs">
                              {getRoleIcon(member.role || "member")}
                              <span className="ml-1">
                                 {member.role || "member"}
                              </span>
                           </Badge>
                        </div>
                     </div>
                  </div>

                  {isOwner && (
                     <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                           <AlertTriangle className="size-4 text-yellow-600 mt-0.5" />
                           <div>
                              <div className="font-medium text-yellow-800 text-sm">
                                 Warning: Owner Removal
                              </div>
                              <div className="text-yellow-700 text-xs mt-1">
                                 You are removing the organization owner. This
                                 action cannot be undone and may result in loss
                                 of administrative control over the
                                 organization.
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="mt-4 p-3 bg-muted rounded-md">
                     <div className="text-sm">
                        <div className="font-medium mb-1">
                           What happens when you remove this member:
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                           <li>
                              • Member will lose access to all organization
                              resources
                           </li>
                           <li>
                              • All pending invitations sent by this member will
                              be revoked
                           </li>
                           <li>• Member will be removed from all teams</li>
                           <li>• This action cannot be undone</li>
                        </ul>
                     </div>
                  </div>
               </div>
            )}

            <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction asChild>
                  <Button
                     disabled={removeMemberMutation.isPending || !member}
                     onClick={handleRemove}
                     variant="destructive"
                  >
                     <UserX className="size-4 mr-2" />
                     {removeMemberMutation.isPending
                        ? "Removing..."
                        : "Remove Member"}
                  </Button>
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
};


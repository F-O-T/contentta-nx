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
import { Button } from "@packages/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2 } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface DeleteTeamDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   team?: any;
}

export function DeleteTeamDialog({
   open,
   onOpenChange,
   team,
}: DeleteTeamDialogProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Placeholder mutation - will need to be connected to actual API
   const deleteTeamMutation = useMutation({
      mutationFn: async (teamId: string) => {
         // TODO: Implement actual team deletion API call
         // For now, just simulate a delay
         await new Promise(resolve => setTimeout(resolve, 1000));
         return { success: true };
      },
      onError: (error) => {
         console.error("Failed to delete team", error);
         toast.error("Failed to delete team. Please try again.");
      },
      onSuccess: async () => {
         toast.success(`Team "${team?.name}" deleted successfully`);
         // Invalidate teams query to refresh the list
         await queryClient.invalidateQueries({
            queryKey: trpc.organization.listTeams.queryKey(),
         });
         onOpenChange(false);
      },
   });

   const handleDelete = useCallback(() => {
      if (!team?.id) {
         toast.error("No team selected for deletion");
         return;
      }
      deleteTeamMutation.mutate(team.id);
   }, [deleteTeamMutation, team]);

   return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle className="flex items-center gap-2">
                  <Building2 className="size-5" />
                  Delete Team
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {team ? (
                     <>
                        Are you sure you want to delete the team <strong>"{team.name}"</strong>?
                         <br />
                         <br />
                        This action will permanently delete the team and remove all team members from it. This action cannot be undone.
                        <br />
                        <br />
                        <span className="text-muted-foreground">
                           Team ID: <code className="bg-muted px-1 rounded text-xs">{team.id}</code>
                        </span>
                     </>
                  ) : (
                     "No team selected for deletion."
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction asChild>
                  <Button
                     disabled={deleteTeamMutation.isPending || !team}
                     onClick={handleDelete}
                     variant="destructive"
                  >
                     <AlertTriangle className="size-4 mr-2" />
                     {deleteTeamMutation.isPending
                        ? "Deleting..."
                        : "Delete Team"}
                  </Button>
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
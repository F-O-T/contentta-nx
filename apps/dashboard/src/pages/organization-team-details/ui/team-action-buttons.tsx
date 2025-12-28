import { Button } from "@packages/ui/components/button";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { betterAuthClient } from "@/integrations/clients";

interface TeamActionButtonsProps {
   teamId: string;
   onDeleteSuccess?: () => void;
}

export function TeamActionButtons({
   teamId,
   onDeleteSuccess,
}: TeamActionButtonsProps) {
   const { openAlertDialog } = useAlertDialog();
   const [isPending, setIsPending] = useState(false);

   const deleteTeam = useCallback(
      async (id: string) => {
         await betterAuthClient.organization.removeTeam(
            {
               teamId: id,
            },
            {
               onRequest: () => {
                  setIsPending(true);
                  toast.loading("Deleting team...");
               },
               onSuccess: () => {
                  setIsPending(false);
                  toast.success("Team deleted successfully");
                  onDeleteSuccess?.();
               },
               onError: (ctx) => {
                  setIsPending(false);
                  toast.error(ctx.error.message || "Failed to delete team");
               },
            },
         );
      },
      [onDeleteSuccess],
   );

   const handleDelete = () => {
      openAlertDialog({
         actionLabel: "Delete Team",
         description:
            "This action will permanently delete this team. Members will remain in the organization but will be removed from this team.",
         onAction: async () => {
            await deleteTeam(teamId);
         },
         title: "Delete Team",
         variant: "destructive",
      });
   };

   return (
      <div className="flex gap-2">
         <Button size="sm" variant="outline">
            <Pencil className="size-4 mr-2" />
            Edit Team
         </Button>
         <Button
            className="text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={handleDelete}
            size="sm"
            variant="outline"
         >
            <Trash2 className="size-4 mr-2" />
            Delete Team
         </Button>
      </div>
   );
}

import type { RouterOutput } from "@packages/api/client";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { createToast } from "@/features/error-modal/lib/create-toast";
import { useTRPC } from "@/integrations/clients";

interface DeleteBrandConfirmationDialogProps {
   brand: RouterOutput["brand"]["list"]["items"][number];
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function DeleteBrandConfirmationDialog({
   brand,
   open,
   onOpenChange,
}: DeleteBrandConfirmationDialogProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const deleteMutation = useMutation(
      trpc.brand.delete.mutationOptions({
         onError: (error) => {
            createToast({
               message: `Failed to delete brand: ${error.message ?? "Unknown error"}`,
               type: "danger",
            });
         },
         onSuccess: async () => {
            createToast({
               message: "Brand deleted successfully",
               type: "success",
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.brand.getByOrganization.queryKey(),
            });
            onOpenChange(false);
         },
      }),
   );

   const handleDelete = async () => {
      try {
         await deleteMutation.mutateAsync({ id: brand.id });
      } catch (error) {
         console.error("Delete failed:", error);
      }
   };

   return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Delete Brand</AlertDialogTitle>
               <AlertDialogDescription>
                  Are you sure you want to delete ? This action cannot be
                  undone.
                  <br />
                  <br />
                  <span className="font-semibold text-destructive">
                     This will permanently delete all brand data, including
                     content and settings.
                  </span>
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={deleteMutation.isPending}>
                  Cancel
               </AlertDialogCancel>
               <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteMutation.isPending}
                  onClick={handleDelete}
               >
                  {deleteMutation.isPending ? (
                     <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                     </>
                  ) : (
                     "Delete"
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}

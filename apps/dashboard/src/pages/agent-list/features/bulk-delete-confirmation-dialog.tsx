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

interface BulkDeleteConfirmationDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   selectedItemsCount: number;
   onConfirm: () => void;
   isDeleting?: boolean;
}

export function BulkDeleteConfirmationDialog({
   open,
   onOpenChange,
   selectedItemsCount,
   onConfirm,
   isDeleting = false,
}: BulkDeleteConfirmationDialogProps) {
   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Delete Selected Agents</AlertDialogTitle>
               <AlertDialogDescription>
                  This will permanently delete {selectedItemsCount} agent
                  {selectedItemsCount > 1 ? "s" : ""} and all associated data from
                  our servers. This action cannot be undone.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={isDeleting}>
                  Cancel
               </AlertDialogCancel>
               <AlertDialogAction
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                  {isDeleting ? "Deleting..." : "Delete"}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
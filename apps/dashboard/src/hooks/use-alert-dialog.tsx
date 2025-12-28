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
import { buttonVariants } from "@packages/ui/components/button";
import { Spinner } from "@packages/ui/components/spinner";
import { cn } from "@packages/ui/lib/utils";
import { Store, useStore } from "@tanstack/react-store";
import { useTransition } from "react";
import { toast } from "sonner";

interface AlertDialogState {
   isOpen: boolean;
   title: string;
   description: string;
   actionLabel: string;
   cancelLabel: string;
   onAction: () => void | Promise<void>;
   variant: "default" | "destructive";
}

const initialState: AlertDialogState = {
   actionLabel: "Confirm",
   cancelLabel: "Cancel",
   description: "",
   isOpen: false,
   onAction: () => {},
   title: "",
   variant: "default",
};

const alertDialogStore = new Store<AlertDialogState>(initialState);

interface OpenAlertDialogOptions {
   title: string;
   description: string;
   onAction: () => void | Promise<void>;
   actionLabel?: string;
   cancelLabel?: string;
   variant?: "default" | "destructive";
}

export const useAlertDialog = () => {
   return {
      closeAlertDialog: () => alertDialogStore.setState(() => initialState),
      openAlertDialog: (options: OpenAlertDialogOptions) =>
         alertDialogStore.setState(() => ({
            actionLabel: options.actionLabel ?? "Confirm",
            cancelLabel: options.cancelLabel ?? "Cancel",
            description: options.description,
            isOpen: true,
            onAction: options.onAction,
            title: options.title,
            variant: options.variant ?? "default",
         })),
   };
};

export function GlobalAlertDialog() {
   const state = useStore(alertDialogStore);
   const [isPending, startTransition] = useTransition();

   const handleAction = async () => {
      await state.onAction();
      alertDialogStore.setState(() => initialState);
   };

   const handleOpenChange = (open: boolean) => {
      if (!open) {
         alertDialogStore.setState(() => initialState);
      }
   };

   return (
      <AlertDialog onOpenChange={handleOpenChange} open={state.isOpen}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>{state.title}</AlertDialogTitle>
               <AlertDialogDescription>
                  {state.description}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>{state.cancelLabel}</AlertDialogCancel>
               <AlertDialogAction
                  className={cn(
                     state.variant === "destructive" &&
                        buttonVariants({ variant: "destructive" }),
                  )}
                  disabled={isPending}
                  onClick={() =>
                     startTransition(async () => {
                        await handleAction().catch((error) => {
                           toast.error(error.message);
                        });
                     })
                  }
               >
                  {isPending ? (
                     <Spinner className="size-4 animate-spin" />
                  ) : null}
                  {state.actionLabel}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}

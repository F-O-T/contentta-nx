import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
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
import { SubscriptionPlansCredenza } from "./subscription-plans-credenza";

interface SubscriptionReminderCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function SubscriptionReminderCredenza({
   open,
   onOpenChange,
}: SubscriptionReminderCredenzaProps) {
   return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Active Subscription Required</AlertDialogTitle>
               <AlertDialogDescription>
                  To use the features of this app, you need an active
                  subscription
               </AlertDialogDescription>
            </AlertDialogHeader>

            <Alert>
               <AlertTitle>Good news!</AlertTitle>
               <AlertDescription>
                  We offer a free plan that doesn't require a credit card. The
                  free plan includes $1 of credits to get you started.
               </AlertDescription>
            </Alert>

            <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction asChild>
                  <SubscriptionPlansCredenza>
                     <Button>View Plans</Button>
                  </SubscriptionPlansCredenza>
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}

import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { SubscriptionReminderCredenza } from "../ui/subscription-reminder-credenza";

const DISMISSED_KEY = "subscription-reminder-dismissed";

export function useSubscriptionReminder() {
   const [showReminder, setShowReminder] = useState(false);
   const trpc = useTRPC();

   const { data: shouldShow } = useSuspenseQuery(
      trpc.subscription.subscriptionReminder.queryOptions(),
   );

   const isDismissed = useCallback(() => {
      if (typeof window === "undefined") return false;
      return localStorage.getItem(DISMISSED_KEY) === "true";
   }, []);

   const dismissReminder = useCallback(() => {
      if (typeof window !== "undefined") {
         localStorage.setItem(DISMISSED_KEY, "true");
      }
   }, []);

   useIsomorphicLayoutEffect(() => {
      if (!shouldShow || isDismissed()) {
         setShowReminder(false);
         return;
      }

      const timer = setTimeout(() => {
         setShowReminder(true);
      }, 500);

      return () => clearTimeout(timer);
   }, [shouldShow, isDismissed]);

   const handleClose = () => {
      setShowReminder(false);
      dismissReminder();
      toast.info(
         "You can upgrade your subscription anytime from the profile page to unlock all features.",
      );
   };

   const SubscriptionReminderComponent = () => (
      <SubscriptionReminderCredenza
         onOpenChange={handleClose}
         open={showReminder}
      />
   );

   return {
      SubscriptionReminderComponent,
      setShowReminder,
      showReminder,
   };
}

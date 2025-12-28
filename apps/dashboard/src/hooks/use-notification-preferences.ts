import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";

export interface NotificationPreferences {
   budgetAlerts: boolean;
   billReminders: boolean;
   overdueAlerts: boolean;
   transactionAlerts: boolean;
}

export function useNotificationPreferences() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const { data: preferences, isLoading } = useQuery(
      trpc.pushNotifications.getPreferences.queryOptions(),
   );

   const updateMutation = useMutation(
      trpc.pushNotifications.updatePreferences.mutationOptions({
         onSettled: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.pushNotifications.getPreferences.queryKey(),
            });
         },
      }),
   );

   const testMutation = useMutation(
      trpc.pushNotifications.testNotification.mutationOptions(),
   );

   const updatePreference = async (
      key: keyof NotificationPreferences,
      value: boolean,
   ) => {
      await updateMutation.mutateAsync({ [key]: value });
   };

   const sendTestNotification = async () => {
      return testMutation.mutateAsync();
   };

   return {
      isLoading,
      isTesting: testMutation.isPending,
      isUpdating: updateMutation.isPending,
      preferences: preferences ?? {
         billReminders: true,
         budgetAlerts: true,
         overdueAlerts: true,
         transactionAlerts: false,
      },
      sendTestNotification,
      testError: testMutation.error,
      testSuccess: testMutation.isSuccess,
      updatePreference,
   };
}

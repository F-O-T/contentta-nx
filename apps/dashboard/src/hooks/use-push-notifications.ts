import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTRPC } from "@/integrations/clients";

type NotificationPermissionState = "default" | "granted" | "denied";

interface PushNotificationState {
   isSupported: boolean;
   isEnabled: boolean;
   permission: NotificationPermissionState;
   subscription: PushSubscription | null;
   isLoading: boolean;
   error: Error | null;
}

export function usePushNotifications() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const [state, setState] = useState<PushNotificationState>({
      error: null,
      isEnabled: false,
      isLoading: true,
      isSupported: false,
      permission: "default",
      subscription: null,
   });

   const { data: vapidData, isLoading: isLoadingVapid } = useQuery(
      trpc.pushNotifications.getVapidPublicKey.queryOptions(),
   );

   const subscribeMutation = useMutation(
      trpc.pushNotifications.subscribe.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.pushNotifications.listSubscriptions.queryKey(),
            });
         },
      }),
   );

   const unsubscribeMutation = useMutation(
      trpc.pushNotifications.unsubscribe.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.pushNotifications.listSubscriptions.queryKey(),
            });
         },
      }),
   );

   useEffect(() => {
      const checkSupport = async () => {
         const isSupported =
            "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window;

         if (!isSupported) {
            setState((prev) => ({
               ...prev,
               isLoading: false,
               isSupported: false,
            }));
            return;
         }

         const permission =
            Notification.permission as NotificationPermissionState;

         try {
            const registration = await navigator.serviceWorker.ready;
            const subscription =
               await registration.pushManager.getSubscription();

            setState({
               error: null,
               isEnabled: !!subscription,
               isLoading: false,
               isSupported: true,
               permission,
               subscription,
            });
         } catch (error) {
            setState((prev) => ({
               ...prev,
               error: error as Error,
               isLoading: false,
               isSupported: true,
               permission,
            }));
         }
      };

      checkSupport();
   }, []);

   const requestPermission = useCallback(async (): Promise<boolean> => {
      if (!state.isSupported) {
         return false;
      }

      try {
         const permission = await Notification.requestPermission();
         setState((prev) => ({
            ...prev,
            permission: permission as NotificationPermissionState,
         }));
         return permission === "granted";
      } catch (error) {
         setState((prev) => ({ ...prev, error: error as Error }));
         return false;
      }
   }, [state.isSupported]);

   const subscribe = useCallback(async (): Promise<boolean> => {
      if (
         !state.isSupported ||
         !vapidData?.enabled ||
         !vapidData.vapidPublicKey
      ) {
         return false;
      }

      try {
         setState((prev) => ({ ...prev, isLoading: true }));

         if (state.permission !== "granted") {
            const granted = await requestPermission();
            if (!granted) {
               setState((prev) => ({ ...prev, isLoading: false }));
               return false;
            }
         }

         const registration = await navigator.serviceWorker.ready;

         const existingSubscription =
            await registration.pushManager.getSubscription();
         if (existingSubscription) {
            await existingSubscription.unsubscribe();
         }

         const subscription = await registration.pushManager.subscribe({
            applicationServerKey: vapidData.vapidPublicKey,
            userVisibleOnly: true,
         });

         const json = subscription.toJSON();
         if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
            throw new Error("Invalid subscription data");
         }

         await subscribeMutation.mutateAsync({
            endpoint: json.endpoint,
            keys: {
               auth: json.keys.auth,
               p256dh: json.keys.p256dh,
            },
            userAgent: navigator.userAgent,
         });

         setState((prev) => ({
            ...prev,
            error: null,
            isEnabled: true,
            isLoading: false,
            subscription,
         }));

         return true;
      } catch (error) {
         setState((prev) => ({
            ...prev,
            error: error as Error,
            isLoading: false,
         }));
         return false;
      }
   }, [
      state.isSupported,
      state.permission,
      vapidData,
      requestPermission,
      subscribeMutation,
   ]);

   const unsubscribe = useCallback(async (): Promise<boolean> => {
      if (!state.subscription) {
         return true;
      }

      try {
         setState((prev) => ({ ...prev, isLoading: true }));

         await unsubscribeMutation.mutateAsync({
            endpoint: state.subscription.endpoint,
         });

         await state.subscription.unsubscribe();

         setState((prev) => ({
            ...prev,
            error: null,
            isEnabled: false,
            isLoading: false,
            subscription: null,
         }));

         return true;
      } catch (error) {
         setState((prev) => ({
            ...prev,
            error: error as Error,
            isLoading: false,
         }));
         return false;
      }
   }, [state.subscription, unsubscribeMutation]);

   const toggle = useCallback(async (): Promise<boolean> => {
      if (state.isEnabled) {
         return unsubscribe();
      }
      return subscribe();
   }, [state.isEnabled, subscribe, unsubscribe]);

   return {
      ...state,
      isLoading: state.isLoading || isLoadingVapid,
      isPushEnabled: vapidData?.enabled ?? false,
      requestPermission,
      subscribe,
      toggle,
      unsubscribe,
   };
}

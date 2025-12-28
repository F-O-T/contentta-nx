import {
   getOrCreateNotificationPreferences,
   updateNotificationPreferences,
} from "@packages/database/repositories/notification-preferences-repository";
import {
   createPushSubscription,
   deletePushSubscriptionByUserAndEndpoint,
   findPushSubscriptionsByUserId,
} from "@packages/database/repositories/push-subscription-repository";
import {
   createNotificationPayload,
   sendPushNotificationToUser,
} from "@packages/notifications/push";
import { APIError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const pushSubscriptionSchema = z.object({
   endpoint: z.string().url(),
   keys: z.object({
      auth: z.string(),
      p256dh: z.string(),
   }),
   userAgent: z.string().optional(),
});

export const pushNotificationRouter = router({
   getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;

      if (!userId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const preferences = await getOrCreateNotificationPreferences(
         resolvedCtx.db,
         userId,
      );

      return {
         billReminders: preferences.billReminders,
         budgetAlerts: preferences.budgetAlerts,
         overdueAlerts: preferences.overdueAlerts,
         transactionAlerts: preferences.transactionAlerts,
      };
   }),
   getVapidPublicKey: publicProcedure.query(async () => {
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
         return { enabled: false, vapidPublicKey: null };
      }
      return { enabled: true, vapidPublicKey };
   }),

   listSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;

      if (!userId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const subscriptions = await findPushSubscriptionsByUserId(
         resolvedCtx.db,
         userId,
      );

      return subscriptions.map((sub) => ({
         createdAt: sub.createdAt,
         endpoint: sub.endpoint,
         id: sub.id,
         userAgent: sub.userAgent,
      }));
   }),

   subscribe: protectedProcedure
      .input(pushSubscriptionSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw APIError.unauthorized("Unauthorized");
         }

         const subscription = await createPushSubscription(resolvedCtx.db, {
            auth: input.keys.auth,
            endpoint: input.endpoint,
            p256dh: input.keys.p256dh,
            userAgent: input.userAgent,
            userId,
         });

         return { subscriptionId: subscription.id, success: true };
      }),

   testNotification: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user.id;

      if (!userId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject =
         process.env.VAPID_SUBJECT || "mailto:admin@montte.co";

      if (!vapidPublicKey || !vapidPrivateKey) {
         throw APIError.internal("Push notifications not configured");
      }

      const payload = createNotificationPayload("transaction", {
         body: "As notificações push estão funcionando corretamente! 🎉",
         title: "Teste de Notificação",
         url: "/",
      });

      const result = await sendPushNotificationToUser({
         db: resolvedCtx.db,
         payload,
         userId,
         vapidPrivateKey,
         vapidPublicKey,
         vapidSubject,
      });

      if (!result.success && result.sent === 0) {
         throw APIError.validation(
            result.errors[0] ||
               "Nenhum dispositivo cadastrado para notificações",
         );
      }

      return {
         failed: result.failed,
         sent: result.sent,
         success: result.success,
      };
   }),

   unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw APIError.unauthorized("Unauthorized");
         }

         await deletePushSubscriptionByUserAndEndpoint(
            resolvedCtx.db,
            userId,
            input.endpoint,
         );

         return { success: true };
      }),

   updatePreferences: protectedProcedure
      .input(
         z.object({
            billReminders: z.boolean().optional(),
            budgetAlerts: z.boolean().optional(),
            overdueAlerts: z.boolean().optional(),
            transactionAlerts: z.boolean().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw APIError.unauthorized("Unauthorized");
         }

         const preferences = await updateNotificationPreferences(
            resolvedCtx.db,
            userId,
            input,
         );

         return {
            billReminders: preferences.billReminders,
            budgetAlerts: preferences.budgetAlerts,
            overdueAlerts: preferences.overdueAlerts,
            transactionAlerts: preferences.transactionAlerts,
         };
      }),
});

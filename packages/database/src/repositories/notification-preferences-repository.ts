import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { notificationPreference } from "../schemas/notification-preferences";

export type NotificationPreference = typeof notificationPreference.$inferSelect;
export type NewNotificationPreference =
   typeof notificationPreference.$inferInsert;

export interface NotificationPreferenceUpdate {
   budgetAlerts?: boolean;
   billReminders?: boolean;
   overdueAlerts?: boolean;
   transactionAlerts?: boolean;
}

const DEFAULT_PREFERENCES: Omit<
   NotificationPreference,
   "id" | "userId" | "createdAt" | "updatedAt"
> = {
   billReminders: true,
   budgetAlerts: true,
   overdueAlerts: true,
   transactionAlerts: false,
};

export async function getOrCreateNotificationPreferences(
   dbClient: DatabaseInstance,
   userId: string,
): Promise<NotificationPreference> {
   try {
      const existing = await dbClient.query.notificationPreference.findFirst({
         where: (pref, { eq }) => eq(pref.userId, userId),
      });

      if (existing) {
         return existing;
      }

      const result = await dbClient
         .insert(notificationPreference)
         .values({
            userId,
            ...DEFAULT_PREFERENCES,
         })
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to create notification preferences");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get or create notification preferences: ${(err as Error).message}`,
      );
   }
}

export async function updateNotificationPreferences(
   dbClient: DatabaseInstance,
   userId: string,
   updates: NotificationPreferenceUpdate,
): Promise<NotificationPreference> {
   try {
      await getOrCreateNotificationPreferences(dbClient, userId);

      const result = await dbClient
         .update(notificationPreference)
         .set({
            ...updates,
            updatedAt: new Date(),
         })
         .where(eq(notificationPreference.userId, userId))
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to update notification preferences");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update notification preferences: ${(err as Error).message}`,
      );
   }
}

export async function shouldSendNotification(
   dbClient: DatabaseInstance,
   userId: string,
   type:
      | "budgetAlerts"
      | "billReminders"
      | "overdueAlerts"
      | "transactionAlerts",
): Promise<boolean> {
   try {
      const preferences = await getOrCreateNotificationPreferences(
         dbClient,
         userId,
      );
      return preferences[type];
   } catch {
      return true;
   }
}

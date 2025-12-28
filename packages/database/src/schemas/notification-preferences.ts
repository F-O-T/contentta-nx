import { sql } from "drizzle-orm";
import { boolean, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notificationPreference = pgTable("notification_preference", {
   billReminders: boolean("bill_reminders").default(true).notNull(),
   budgetAlerts: boolean("budget_alerts").default(true).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   overdueAlerts: boolean("overdue_alerts").default(true).notNull(),
   transactionAlerts: boolean("transaction_alerts").default(false).notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
   userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
});

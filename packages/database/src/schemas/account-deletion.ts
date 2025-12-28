import { sql } from "drizzle-orm";
import {
   index,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";

export const deletionTypeEnum = pgEnum("deletion_type", [
   "immediate",
   "grace_period",
]);

export const deletionStatusEnum = pgEnum("deletion_status", [
   "pending",
   "cancelled",
   "completed",
]);

export const accountDeletionRequest = pgTable(
   "account_deletion_request",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      // No FK reference - stored as plain uuid for audit purposes
      // This ensures the audit record survives after user deletion
      userId: uuid("user_id").notNull(),
      // Email stored for audit trail since user record will be deleted
      userEmail: text("user_email").notNull(),
      type: deletionTypeEnum("type").notNull(),
      reason: text("reason"),
      requestedAt: timestamp("requested_at").defaultNow().notNull(),
      scheduledDeletionAt: timestamp("scheduled_deletion_at"),
      cancelledAt: timestamp("cancelled_at"),
      completedAt: timestamp("completed_at"),
      status: deletionStatusEnum("status").default("pending").notNull(),
      remindersSent: text("reminders_sent")
         .array()
         .default(sql`'{}'::text[]`)
         .notNull(), // ["7_day", "1_day"]
   },
   (table) => [index("accountDeletion_userId_idx").on(table.userId)],
);

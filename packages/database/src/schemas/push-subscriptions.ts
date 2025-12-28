import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const pushSubscription = pgTable(
   "push_subscription",
   {
      auth: text("auth").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      endpoint: text("endpoint").notNull(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      p256dh: text("p256dh").notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      userAgent: text("user_agent"),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [unique("push_subscription_endpoint_idx").on(table.endpoint)],
);

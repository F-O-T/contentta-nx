import { sql } from "drizzle-orm";
import {
   boolean,
   json,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notification = pgTable("notification", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   isRead: boolean("is_read").default(false).notNull(),
   message: text("message").notNull(),
   metadata: json("metadata"), // e.g. { categoryId: '...', spent: 100, budget: 100 }
   title: text("title").notNull(),
   type: text("type").notNull(), // e.g. 'budget_alert'
   userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

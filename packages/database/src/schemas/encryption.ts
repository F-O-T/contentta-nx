import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Encryption metadata table for tracking E2E encrypted fields
 *
 * This table stores metadata about which records have E2E encrypted fields.
 * The actual encrypted values are stored inline in the original tables
 * as JSON objects (E2EEncryptedData structure).
 *
 * This is used for:
 * - Tracking which records need re-encryption on passphrase change
 * - Audit trail of encrypted data
 * - Batch operations (e.g., decrypt all on E2E disable)
 */
export const encryptionMetadata = pgTable(
   "encryption_metadata",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      tableName: text("table_name").notNull(),
      recordId: uuid("record_id").notNull(),
      fieldName: text("field_name").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("encryption_userId_idx").on(table.userId),
      index("encryption_record_idx").on(table.tableName, table.recordId),
   ],
);

export const encryptionMetadataRelations = relations(
   encryptionMetadata,
   ({ one }) => ({
      user: one(user, {
         fields: [encryptionMetadata.userId],
         references: [user.id],
      }),
   }),
);

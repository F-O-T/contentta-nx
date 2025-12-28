/**
 * Migration script to encrypt existing database data
 *
 * This script encrypts sensitive fields in:
 * - Transactions: description
 * - Bills: description, notes
 * - Counterparties: notes
 *
 * Usage:
 *   bun run scripts/encrypt-data.ts check --env local
 *   bun run scripts/encrypt-data.ts run --env local --dry-run
 *   bun run scripts/encrypt-data.ts run --env local
 */

import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

// Static imports for schema tables
import { transaction } from "../packages/database/src/schemas/transactions";
import { bill } from "../packages/database/src/schemas/bills";
import { counterparty } from "../packages/database/src/schemas/counterparties";

// Import shared encryption functions
import { encryptField, isEncrypted } from "../packages/encryption/src/server";

const program = new Command();

const colors = {
   blue: chalk.blue,
   cyan: chalk.cyan,
   green: chalk.green,
   magenta: chalk.magenta,
   red: chalk.red,
   yellow: chalk.yellow,
};

function getEnvFilePath(env: string): string {
   const packageDir = path.join(process.cwd(), "packages", "database");
   const possibleFiles = [`.env.${env}`, `.env.local`, `.env`];

   for (const file of possibleFiles) {
      const filePath = path.join(packageDir, file);
      if (fs.existsSync(filePath)) {
         return filePath;
      }
   }

   throw new Error(`No environment file found for ${env}`);
}

function encryptValue(value: string | null, key: string): string | null {
   if (!value) return value;

   // Check if already encrypted
   try {
      const parsed = JSON.parse(value);
      if (isEncrypted(parsed)) {
         return value;
      }
   } catch {
      // Not JSON, needs encryption
   }

   return JSON.stringify(encryptField(value, key));
}

async function encryptTransactions(
   db: ReturnType<typeof drizzle>,
   key: string,
   dryRun: boolean,
) {
   console.log(colors.blue("\n📦 Encrypting transactions..."));

   const BATCH_SIZE = 100;
   let offset = 0;
   let totalEncrypted = 0;
   let totalSkipped = 0;
   let batchNumber = 0;

   while (true) {
      const transactions = await db
         .select({
            id: transaction.id,
            description: transaction.description,
         })
         .from(transaction)
         .limit(BATCH_SIZE)
         .offset(offset);

      if (transactions.length === 0) break;

      batchNumber++;

      // Collect updates for this batch
      const updates: Array<{ id: string; description: string | null }> = [];

      for (const txn of transactions) {
         const encryptedDescription = encryptValue(txn.description, key);

         if (encryptedDescription !== txn.description) {
            updates.push({ id: txn.id, description: encryptedDescription });
         } else {
            totalSkipped++;
         }
      }

      // Apply updates atomically within a transaction
      if (updates.length > 0) {
         if (dryRun) {
            // In dry run mode, just count without persisting
            totalEncrypted += updates.length;
         } else {
            try {
               await db.transaction(async (tx) => {
                  for (const update of updates) {
                     await tx
                        .update(transaction)
                        .set({ description: update.description })
                        .where(eq(transaction.id, update.id));
                  }
               });
               totalEncrypted += updates.length;
            } catch (error) {
               console.error(
                  colors.red(
                     `\n   ❌ Batch ${batchNumber} failed, rolled back: ${error instanceof Error ? error.message : String(error)}`,
                  ),
               );
               throw error;
            }
         }
      }

      offset += BATCH_SIZE;
      process.stdout.write(
         `\r   Processed ${offset} transactions... (${dryRun ? "DRY RUN" : "LIVE"})`,
      );
   }

   console.log(
      colors.green(
         `\n   ✅ ${dryRun ? "Would encrypt" : "Encrypted"}: ${totalEncrypted}, Skipped: ${totalSkipped}`,
      ),
   );
}

async function encryptBills(
   db: ReturnType<typeof drizzle>,
   key: string,
   dryRun: boolean,
) {
   console.log(colors.blue("\n📦 Encrypting bills..."));

   const BATCH_SIZE = 100;
   let offset = 0;
   let totalEncrypted = 0;
   let totalSkipped = 0;
   let batchNumber = 0;

   while (true) {
      const bills = await db
         .select({
            id: bill.id,
            description: bill.description,
            notes: bill.notes,
         })
         .from(bill)
         .limit(BATCH_SIZE)
         .offset(offset);

      if (bills.length === 0) break;

      batchNumber++;

      // Collect updates for this batch
      const updates: Array<{
         id: string;
         description: string | null;
         notes: string | null;
      }> = [];

      for (const b of bills) {
         const encryptedDescription = encryptValue(b.description, key);
         const encryptedNotes = encryptValue(b.notes, key);

         if (
            encryptedDescription !== b.description ||
            encryptedNotes !== b.notes
         ) {
            updates.push({
               id: b.id,
               description: encryptedDescription,
               notes: encryptedNotes,
            });
         } else {
            totalSkipped++;
         }
      }

      // Apply updates atomically within a transaction
      if (updates.length > 0) {
         if (dryRun) {
            // In dry run mode, just count without persisting
            totalEncrypted += updates.length;
         } else {
            try {
               await db.transaction(async (tx) => {
                  for (const update of updates) {
                     await tx
                        .update(bill)
                        .set({
                           description: update.description,
                           notes: update.notes,
                        })
                        .where(eq(bill.id, update.id));
                  }
               });
               totalEncrypted += updates.length;
            } catch (error) {
               console.error(
                  colors.red(
                     `\n   ❌ Batch ${batchNumber} failed, rolled back: ${error instanceof Error ? error.message : String(error)}`,
                  ),
               );
               throw error;
            }
         }
      }

      offset += BATCH_SIZE;
      process.stdout.write(
         `\r   Processed ${offset} bills... (${dryRun ? "DRY RUN" : "LIVE"})`,
      );
   }

   console.log(
      colors.green(
         `\n   ✅ ${dryRun ? "Would encrypt" : "Encrypted"}: ${totalEncrypted}, Skipped: ${totalSkipped}`,
      ),
   );
}

async function encryptCounterparties(
   db: ReturnType<typeof drizzle>,
   key: string,
   dryRun: boolean,
) {
   console.log(colors.blue("\n📦 Encrypting counterparties..."));

   const BATCH_SIZE = 100;
   let offset = 0;
   let totalEncrypted = 0;
   let totalSkipped = 0;
   let batchNumber = 0;

   while (true) {
      const counterparties = await db
         .select({
            id: counterparty.id,
            notes: counterparty.notes,
         })
         .from(counterparty)
         .limit(BATCH_SIZE)
         .offset(offset);

      if (counterparties.length === 0) break;

      batchNumber++;

      // Collect updates for this batch
      const updates: Array<{ id: string; notes: string | null }> = [];

      for (const cp of counterparties) {
         const encryptedNotes = encryptValue(cp.notes, key);

         if (encryptedNotes !== cp.notes) {
            updates.push({ id: cp.id, notes: encryptedNotes });
         } else {
            totalSkipped++;
         }
      }

      // Apply updates atomically within a transaction
      if (updates.length > 0) {
         if (dryRun) {
            // In dry run mode, just count without persisting
            totalEncrypted += updates.length;
         } else {
            try {
               await db.transaction(async (tx) => {
                  for (const update of updates) {
                     await tx
                        .update(counterparty)
                        .set({ notes: update.notes })
                        .where(eq(counterparty.id, update.id));
                  }
               });
               totalEncrypted += updates.length;
            } catch (error) {
               console.error(
                  colors.red(
                     `\n   ❌ Batch ${batchNumber} failed, rolled back: ${error instanceof Error ? error.message : String(error)}`,
                  ),
               );
               throw error;
            }
         }
      }

      offset += BATCH_SIZE;
      process.stdout.write(
         `\r   Processed ${offset} counterparties... (${dryRun ? "DRY RUN" : "LIVE"})`,
      );
   }

   console.log(
      colors.green(
         `\n   ✅ ${dryRun ? "Would encrypt" : "Encrypted"}: ${totalEncrypted}, Skipped: ${totalSkipped}`,
      ),
   );
}

async function runEncryption(env: string, dryRun: boolean) {
   console.log(colors.blue("🔐 Starting database encryption migration..."));
   console.log(colors.cyan(`   Environment: ${env}`));
   console.log(colors.cyan(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`));
   console.log(colors.cyan("─".repeat(50)));

   // Load environment
   const envFile = getEnvFilePath(env);
   console.log(colors.cyan(`   Loading env from: ${envFile}`));
   config({ path: envFile });

   const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
   const DATABASE_URL = process.env.DATABASE_URL;

   if (!ENCRYPTION_KEY) {
      console.error(colors.red("❌ ENCRYPTION_KEY environment variable is required"));
      process.exit(1);
   }

   if (ENCRYPTION_KEY.length !== 64) {
      console.error(colors.red("❌ ENCRYPTION_KEY must be a 64-character hex string"));
      process.exit(1);
   }

   if (!DATABASE_URL) {
      console.error(colors.red("❌ DATABASE_URL environment variable is required"));
      process.exit(1);
   }

   console.log(colors.cyan(`   Using key: ${ENCRYPTION_KEY.substring(0, 8)}...`));

   // Connect to database
   const pool = new Pool({ connectionString: DATABASE_URL });
   const db = drizzle(pool);

   try {
      await encryptTransactions(db, ENCRYPTION_KEY, dryRun);
      await encryptBills(db, ENCRYPTION_KEY, dryRun);
      await encryptCounterparties(db, ENCRYPTION_KEY, dryRun);

      console.log(colors.cyan("\n" + "─".repeat(50)));
      if (dryRun) {
         console.log(colors.yellow("⚠️  DRY RUN completed - no data was modified"));
         console.log(colors.yellow("   Run without --dry-run to apply changes"));
      } else {
         console.log(colors.green("✅ Migration completed successfully!"));
      }
   } catch (error) {
      console.error(colors.red("\n❌ Migration failed:"), error);
      process.exit(1);
   } finally {
      await pool.end();
   }
}

program
   .name("encrypt-data")
   .description("Encrypt existing database data with server-side encryption")
   .version("1.0.0");

program
   .command("run")
   .description("Run the encryption migration")
   .option("-e, --env <environment>", "Environment to use (local, production)", "local")
   .option("--dry-run", "Preview changes without modifying data", false)
   .action((options) => {
      runEncryption(options.env, options.dryRun);
   });

program
   .command("check")
   .description("Check if encryption key is properly configured")
   .option("-e, --env <environment>", "Environment to use", "local")
   .action((options) => {
      const envFile = getEnvFilePath(options.env);
      config({ path: envFile });

      const key = process.env.ENCRYPTION_KEY;
      const dbUrl = process.env.DATABASE_URL;

      console.log(colors.blue("🔍 Checking encryption configuration...\n"));

      if (!key) {
         console.log(colors.red("❌ ENCRYPTION_KEY is not set"));
      } else if (key.length !== 64) {
         console.log(colors.red(`❌ ENCRYPTION_KEY is ${key.length} chars (needs 64)`));
      } else if (!/^[0-9a-fA-F]+$/.test(key)) {
         console.log(colors.red("❌ ENCRYPTION_KEY is not a valid hex string"));
      } else {
         console.log(colors.green(`✅ ENCRYPTION_KEY is valid (${key.substring(0, 8)}...)`));
      }

      if (!dbUrl) {
         console.log(colors.red("❌ DATABASE_URL is not set"));
      } else {
         console.log(colors.green("✅ DATABASE_URL is set"));
      }
   });

program.parse();

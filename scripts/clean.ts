import * as fs from "node:fs";
import * as readline from "node:readline";
import { execSync } from "node:child_process";
import { spawn } from "node:child_process";
import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

// Colors
const colors = {
   blue: chalk.blue,
   green: chalk.green,
   yellow: chalk.yellow,
   red: chalk.red,
   cyan: chalk.cyan,
   magenta: chalk.magenta,
};

// Directories and files to clean
const CLEAN_TARGETS = [
   // NX cache
   ".nx/cache",
   ".nx/workspace-data",

   // Common cache directories
   ".turbo",
   "dist",
   "build",

   // App and package specific
   "apps/*/dist",
   "apps/*/build",
   "apps/*/.tanstack",
   "apps/*/.astro",
   "apps/*/.cache",
   "apps/*/node_modules",

   "packages/*/dist",
   "packages/*/.mastra",
   "packages/*/.cache",
   "packages/*/build",
   "packages/*/node_modules",

   // Root level
   "node_modules",

   // Common lock files
   "bun.lockb",
   "package-lock.json",
   "yarn.lock",
   "pnpm-lock.yaml",

   // Common cache files
   ".DS_Store",
   "*.tsbuildinfo",
   ".eslintcache",
   ".cache",

   // Drizzle specific
   "**/drizzle",
   "**/.drizzle",
];

function runCommand(
   command: string,
   cwd: string = process.cwd(),
): Promise<void> {
   return new Promise((resolve, reject) => {
      console.log(colors.blue(`🚀 Running: ${command}`));

      const child = spawn(command, [], {
         cwd,
         shell: true,
         stdio: "inherit",
      });

      child.on("close", (code) => {
         if (code === 0) {
            resolve();
         } else {
            reject(new Error(`Command failed with exit code ${code}`));
         }
      });

      child.on("error", (error) => {
         reject(error);
      });
   });
}

function deletePath(pathToDelete: string): boolean {
   try {
      if (fs.existsSync(pathToDelete)) {
         const stats = fs.statSync(pathToDelete);

         if (stats.isDirectory()) {
            fs.rmSync(pathToDelete, { recursive: true, force: true });
            console.log(colors.green(`🗑️  Deleted directory: ${pathToDelete}`));
         } else {
            fs.unlinkSync(pathToDelete);
            console.log(colors.green(`🗑️  Deleted file: ${pathToDelete}`));
         }
         return true;
      }
      return false;
   } catch (error) {
      console.log(colors.red(`❌ Failed to delete ${pathToDelete}: ${error}`));
      return false;
   }
}

function expandGlobPatterns(patterns: string[]): string[] {
   const expandedPaths: string[] = [];

   patterns.forEach((pattern) => {
      try {
         // Use find to handle glob patterns safely
         const result = execSync(
            `find . -path "${pattern}" -not -path "./node_modules/*" 2>/dev/null || true`,
            {
               encoding: "utf8",
               cwd: process.cwd(),
            },
         );

         if (result.trim()) {
            const paths = result
               .trim()
               .split("\n")
               .filter((p) => p);
            expandedPaths.push(...paths);
         }
      } catch (error) {
         console.error(
            colors.red(`❌ Error expanding pattern ${pattern}: ${error}`),
         );
      }
   });

   // Remove duplicates and sort
   return [...new Set(expandedPaths)].sort();
}

async function clean(options: {
   dryRun?: boolean;
   noInstall?: boolean;
   deep?: boolean;
}) {
   console.log(colors.blue.bold("🧹 Starting monorepo cleanup..."));
   console.log(colors.cyan("─".repeat(50)));

   let deletedCount = 0;
   let skippedCount = 0;

   // Handle dry run first
   if (options.dryRun) {
      console.log(colors.yellow("🔍 DRY RUN MODE - No files will be deleted"));
      console.log(colors.cyan("─".repeat(50)));
   }

   // Expand glob patterns to get actual paths
   const pathsToClean = expandGlobPatterns(CLEAN_TARGETS);

   if (pathsToClean.length === 0) {
      console.log(colors.green("✅ No cache or build files found to clean"));
      return;
   }

   console.log(colors.blue(`📋 Found ${pathsToClean.length} items to clean:`));

   // Clean each path
   for (const pathToClean of pathsToClean) {
      if (options.dryRun) {
         console.log(colors.yellow(`🔍 Would delete: ${pathToClean}`));
         deletedCount++;
      } else {
         if (deletePath(pathToClean)) {
            deletedCount++;
         } else {
            skippedCount++;
         }
      }
   }

   console.log(colors.cyan("─".repeat(50)));

   if (options.dryRun) {
      console.log(
         colors.yellow(`🔍 DRY RUN: Would delete ${deletedCount} items`),
      );
      console.log(
         colors.blue("💡 Run without --dry-run to actually delete these files"),
      );
   } else {
      console.log(
         colors.green(`🎉 Cleanup complete! Deleted ${deletedCount} items`),
      );
      if (skippedCount > 0) {
         console.log(colors.yellow(`⚠️  Skipped ${skippedCount} items`));
      }

      // Offer to reinstall dependencies if node_modules was deleted
      const rootNodeModulesDeleted = pathsToClean.includes("node_modules");
      if (rootNodeModulesDeleted && !options.dryRun && !options.noInstall) {
         console.log(colors.blue("📦 Root node_modules was deleted"));

         // Check if user wants to reinstall
         const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
         });

         const answer = await new Promise<string>((resolve) => {
            rl.question(
               colors.yellow(
                  "🤔 Would you like to reinstall dependencies? (y/N): ",
               ),
               resolve,
            );
         });

         rl.close();

         if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            console.log(colors.blue("📦 Reinstalling dependencies..."));
            try {
               await runCommand("bun install");
               console.log(
                  colors.green("✅ Dependencies reinstalled successfully"),
               );
            } catch (error) {
               console.error(
                  colors.red("❌ Failed to reinstall dependencies", error),
               );
            }
         }
      }
   }
}

async function reset(options: { force?: boolean; noInstall?: boolean }) {
   console.log(colors.blue.bold("🔄 Starting monorepo reset..."));
   console.log(
      colors.yellow(
         "⚠️  This will delete ALL uncommitted changes and reset the repository",
      ),
   );
   console.log(colors.cyan("─".repeat(50)));

   if (!options.force) {
      const rl = readline.createInterface({
         input: process.stdin,
         output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
         rl.question(
            colors.red(
               "🚨 Are you absolutely sure you want to continue? This action cannot be undone. (type 'RESET' to confirm): ",
            ),
            resolve,
         );
      });

      rl.close();

      if (answer !== "RESET") {
         console.log(colors.green("✅ Reset cancelled"));
         return;
      }
   }

   try {
      // Reset git repository
      console.log(colors.blue("🔄 Resetting git repository..."));
      await runCommand("git reset --hard HEAD");
      await runCommand("git clean -fd");

      // Then run clean
      await clean({ ...options, noInstall: true });

      console.log(colors.green("🎉 Monorepo reset complete!"));
   } catch (error) {
      console.log(colors.red(`❌ Reset failed: ${error}`));
   }
}

// Commands
program
   .name("clean")
   .description("CLI tool for cleaning monorepo cache and build files")
   .version("1.0.0");

program
   .command("clean")
   .description("Clean cache, build files, and optionally node_modules")
   .option("--dry-run", "Show what would be deleted without actually deleting")
   .option("--no-install", "Skip dependency reinstallation prompt")
   .option("--deep", "Also clean node_modules in all packages")
   .action((options) => {
      clean(options);
   });

program
   .command("reset")
   .description("Complete reset: clean + git reset + clean uncommitted changes")
   .option("--force", "Skip confirmation prompt")
   .option("--no-install", "Skip dependency reinstallation prompt")
   .action((options) => {
      reset(options);
   });

program
   .command("cache")
   .description("Clean only cache files (no build files or node_modules)")
   .option("--dry-run", "Show what would be deleted without actually deleting")
   .action((options) => {
      // Only clean cache-related targets
      const cacheTargets = [
         ".nx/cache",
         ".nx/workspace-data",
         ".turbo",
         ".cache",
         ".eslintcache",
         "*.tsbuildinfo",
      ];

      const originalTargets = [...CLEAN_TARGETS];
      CLEAN_TARGETS.length = 0;
      CLEAN_TARGETS.push(...cacheTargets);

      clean(options).then(() => {
         // Restore original targets
         CLEAN_TARGETS.length = 0;
         CLEAN_TARGETS.push(...originalTargets);
      });
   });

program.parse();

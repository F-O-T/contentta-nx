import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import { Command } from "commander";

const program = new Command();

// Colors
const colors = {
   blue: chalk.blue,
   cyan: chalk.cyan,
   green: chalk.green,
   magenta: chalk.magenta,
   red: chalk.red,
   yellow: chalk.yellow,
};

// Functions
function setupEnvFile(dir: string, appName: string, envType: string = "local") {
   let envPath: string;
   const envExamplePath = path.join(dir, ".env.example");

   // All packages/apps need a .env file
   if (envType === "local" || envType === "production") {
      // For database/rag packages with specific env types
      envPath = path.join(dir, `.env.${envType}`);
   } else {
      // Default .env file for all packages/apps
      envPath = path.join(dir, ".env");
   }

   if (fs.existsSync(envExamplePath)) {
      if (!fs.existsSync(envPath)) {
         console.log(
            colors.green(
               `✓ Creating ${path.basename(envPath)} file for ${appName}`,
            ),
         );
         fs.copyFileSync(envExamplePath, envPath);
         console.log(
            colors.yellow(
               `⚠️  Please update ${envPath} with your actual values`,
            ),
         );
         return true;
      } else {
         console.log(
            colors.green(
               `✓ ${appName} ${path.basename(envPath)} file already exists`,
            ),
         );
         return false;
      }
   } else {
      console.log(colors.red(`✗ No .env.example found for ${appName}`));
      return false;
   }
}

function listAppDirectories() {
   const directories: string[] = [];

   // Check apps directory
   const appsDir = "apps";
   if (fs.existsSync(appsDir)) {
      const apps = fs
         .readdirSync(appsDir, { withFileTypes: true })
         .filter((dirent) => dirent.isDirectory())
         .map((dirent) => path.join(appsDir, dirent.name));
      directories.push(...apps);
   } else {
      console.log(colors.yellow("⚠️  No apps directory found"));
   }

   // Check packages directory
   const packagesDir = "packages";
   if (fs.existsSync(packagesDir)) {
      const packages = fs
         .readdirSync(packagesDir, { withFileTypes: true })
         .filter((dirent) => dirent.isDirectory())
         .map((dirent) => path.join(packagesDir, dirent.name));
      directories.push(...packages);
   } else {
      console.log(colors.yellow("⚠️  No packages directory found"));
   }

   return directories;
}

function validateEnvFiles(appDirs: string[]) {
   console.log(colors.blue("🔍 Validating environment files..."));

   let allValid = true;
   const missingEnvFiles: string[] = [];
   const missingLocalFiles: string[] = [];
   const missingProductionFiles: string[] = [];
   const missingExamples: string[] = [];

   appDirs.forEach((appDir) => {
      const appName = path.basename(appDir);
      const envExamplePath = path.join(appDir, ".env.example");

      // Check if .env.example exists
      if (!fs.existsSync(envExamplePath)) {
         missingExamples.push(appName);
         allValid = false;
      }

      // Check for .env file for all packages/apps that have .env.example
      if (fs.existsSync(envExamplePath)) {
         const envPath = path.join(appDir, ".env");
         if (!fs.existsSync(envPath)) {
            missingEnvFiles.push(appName);
            allValid = false;
         }
      }

      // Special handling for database and rag packages
      if (appName === "database" || appName === "rag") {
         const envLocalPath = path.join(appDir, ".env.local");
         if (!fs.existsSync(envLocalPath)) {
            missingLocalFiles.push(appName);
            allValid = false;
         }

         const envProductionPath = path.join(appDir, ".env.production.local");
         if (!fs.existsSync(envProductionPath)) {
            missingProductionFiles.push(appName);
            allValid = false;
         }
      }
   });

   if (allValid) {
      console.log(
         colors.green("✅ All environment files are properly set up!"),
      );
   } else {
      console.log(colors.red("❌ Environment setup issues found:"));

      if (missingExamples.length > 0) {
         console.log(
            colors.yellow(
               `  Missing .env.example files: ${missingExamples.join(", ")}`,
            ),
         );
      }
      if (missingEnvFiles.length > 0) {
         console.log(
            colors.yellow(
               `  Missing .env files: ${missingEnvFiles.join(", ")}`,
            ),
         );
      }
      if (missingLocalFiles.length > 0) {
         console.log(
            colors.yellow(
               `  Missing .env.local files (database/rag only): ${missingLocalFiles.join(", ")}`,
            ),
         );
      }
      if (missingProductionFiles.length > 0) {
         console.log(
            colors.yellow(
               `  Missing .env.production.local files (database/rag only): ${missingProductionFiles.join(", ")}`,
            ),
         );
      }
   }

   return allValid;
}

// Commands
program
   .name("env-setup")
   .description("CLI tool for setting up environment files in a monorepo")
   .version("1.0.0");

program
   .command("setup")
   .description("Set up environment files for all applications")
   .option("-f, --force", "Overwrite existing .env files")
   .option(
      "-e, --env <type>",
      "Environment type to setup (local, production)",
      "local",
   )
   .action((options) => {
      console.log(colors.blue(`🔧 Setting up environment files for monorepo`));
      console.log(colors.cyan("📁 Scanning for application directories..."));

      const appDirs = listAppDirectories();
      let createdCount = 0;

      appDirs.forEach((appDir) => {
         const appName = path.basename(appDir);

         // Skip if no .env.example exists
         if (!fs.existsSync(path.join(appDir, ".env.example"))) {
            return;
         }

         // Create .env file for all packages/apps that have .env.example
         const envPath = path.join(appDir, ".env");
         if (options.force || !fs.existsSync(envPath)) {
            if (setupEnvFile(appDir, appName, "default")) {
               createdCount++;
            }
         } else {
            console.log(
               colors.green(
                  `✓ ${appName} .env file already exists (use --force to overwrite)`,
               ),
            );
         }

         // Special handling for database and rag packages
         if (appName === "database" || appName === "rag") {
            // Create .env.local
            const envLocalPath = path.join(appDir, ".env.local");
            if (options.force || !fs.existsSync(envLocalPath)) {
               if (setupEnvFile(appDir, appName, "local")) {
                  createdCount++;
               }
            } else {
               console.log(
                  colors.green(
                     `✓ ${appName} .env.local file already exists (use --force to overwrite)`,
                  ),
               );
            }

            // Create .env.production.local
            const envProductionPath = path.join(
               appDir,
               ".env.production.local",
            );
            if (options.force || !fs.existsSync(envProductionPath)) {
               if (setupEnvFile(appDir, appName, "production")) {
                  createdCount++;
               }
            } else {
               console.log(
                  colors.green(
                     `✓ ${appName} .env.production.local file already exists (use --force to overwrite)`,
                  ),
               );
            }
         }
      });

      console.log(
         colors.green(
            `🎉 Environment setup complete! Created ${createdCount} new environment files`,
         ),
      );
      console.log(colors.yellow("💡 Remember to:"));
      console.log(
         colors.yellow("  1. Update all .env files with your actual values"),
      );
      console.log(colors.yellow("  2. Never commit .env files to git"));
      console.log(
         colors.yellow(
            "  3. Add any required environment variables to .env.example files",
         ),
      );
   });

program
   .command("validate")
   .description("Validate that all environment files are properly set up")
   .action(() => {
      const appDirs = listAppDirectories();
      const isValid = validateEnvFiles(appDirs);

      if (!isValid) {
         process.exit(1);
      }
   });

program
   .command("list")
   .description("List all applications and their environment file status")
   .action(() => {
      console.log(colors.blue("📋 Environment File Status"));
      console.log(colors.cyan("─".repeat(50)));

      const appDirs = listAppDirectories();

      appDirs.forEach((appDir) => {
         const appName = path.basename(appDir);
         const envExamplePath = path.join(appDir, ".env.example");

         const hasExample = fs.existsSync(envExamplePath);
         let statusLine = `${colors.magenta(`${appName}:`)} ${hasExample ? "📄" : "❌"} .env.example`;

         // Show .env file status for packages that have .env.example
         if (hasExample) {
            const hasEnv = fs.existsSync(path.join(appDir, ".env"));
            statusLine += ` ${hasEnv ? "📄" : "❌"} .env`;

            // Special handling for database and rag packages
            if (appName === "database" || appName === "rag") {
               const hasLocal = fs.existsSync(path.join(appDir, ".env.local"));
               statusLine += ` ${hasLocal ? "📄" : "❌"} .env.local`;

               const hasProduction = fs.existsSync(
                  path.join(appDir, ".env.production.local"),
               );
               statusLine += ` ${hasProduction ? "📄" : "❌"} .env.production.local`;
            }
         }

         console.log(statusLine);
      });
   });

program
   .command("clean")
   .description("Remove all .env files (use with caution)")
   .option("--confirm", "Skip confirmation prompt")
   .action((options) => {
      if (!options.confirm) {
         console.log(
            colors.red("⚠️  This will remove all .env files from the monorepo!"),
         );
         console.log(colors.yellow("Are you sure you want to continue? (y/N)"));

         // In a real CLI, you'd use readline or similar
         console.log(colors.yellow("Run with --confirm to skip this prompt"));
         return;
      }

      console.log(colors.blue("🧹 Cleaning up .env files..."));

      const appDirs = listAppDirectories();
      let removedCount = 0;

      // Remove app .env files
      appDirs.forEach((appDir) => {
         const envFiles = [".env.local", ".env.production.local", ".env"];
         envFiles.forEach((envFile) => {
            const envPath = path.join(appDir, envFile);
            if (fs.existsSync(envPath)) {
               fs.unlinkSync(envPath);
               console.log(colors.green(`✓ Removed ${envPath}`));
               removedCount++;
            }
         });
      });

      console.log(
         colors.green(
            `🎉 Cleanup complete! Removed ${removedCount} .env files`,
         ),
      );
   });

program.parse();

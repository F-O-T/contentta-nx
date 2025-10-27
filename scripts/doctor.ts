import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";

const checks = [
   {
      name: "Node.js Version",
      fn: () => {
         const version = process.versions.node;
         const majorVersion = parseInt(version.split(".")[0] || "0", 10);
         if (majorVersion < 20) {
            throw new Error(
               `Node.js version is ${version}, but >=20 is required.`,
            );
         }
         return `v${version}`;
      },
   },
   {
      name: "Bun Version",
      fn: () => {
         try {
            const version = execSync("bun --version").toString().trim();
            return version;
         } catch (error) {
            console.error(error);
            throw new Error(
               "Bun is not installed. Please visit https://bun.sh/",
            );
         }
      },
   },
   {
      name: "Podman",
      fn: () => {
         try {
            const version = execSync("podman --version").toString().trim();
            return version;
         } catch (error) {
            console.error(error);

            throw new Error(
               "Podman is not installed or not in PATH. Please install it to run local dependencies.",
            );
         }
      },
   },
   {
      name: "Podman Compose",
      fn: () => {
         try {
            const version = execSync("podman-compose version")
               .toString()
               .trim();
            return version;
         } catch (error) {
            console.error(error);

            throw new Error(
               "Podman Compose is not available. Please ensure you have podman-compose installed.",
            );
         }
      },
   },
   {
      name: "Dependencies",
      fn: () => {
         if (!fs.existsSync("node_modules")) {
            throw new Error(
               "node_modules not found. Please run 'bun install'.",
            );
         }
         return "Installed";
      },
   },
   {
      name: "Environment Files",
      fn: () => {
         const allDirs: string[] = [];

         // Check apps directory
         if (fs.existsSync("apps")) {
            const appDirs = fs
               .readdirSync("apps")
               .map((name) => `apps/${name}`);
            allDirs.push(...appDirs);
         }

         // Check packages directory
         if (fs.existsSync("packages")) {
            const pkgDirs = fs
               .readdirSync("packages")
               .map((name) => `packages/${name}`);
            allDirs.push(...pkgDirs);
         }

         const missingEnv: string[] = [];
         const missingLocal: string[] = [];
         const missingProduction: string[] = [];

         for (const dir of allDirs) {
            const dirName = path.basename(dir);
            const hasExample = fs.existsSync(path.join(dir, ".env.example"));

            if (!hasExample) {
               continue;
            }

            // Check for .env file for all packages/apps that have .env.example
            if (!fs.existsSync(path.join(dir, ".env"))) {
               missingEnv.push(dirName);
            }

            // Special handling for RAG and database packages - they need both local and production env files
            if (dirName === "database" || dirName === "rag") {
               if (!fs.existsSync(path.join(dir, ".env.local"))) {
                  missingLocal.push(dirName);
               }
               if (!fs.existsSync(path.join(dir, ".env.production.local"))) {
                  missingProduction.push(dirName);
               }
            }
         }

         const issues = [];
         if (missingEnv.length > 0) {
            issues.push(`Missing .env files in: ${missingEnv.join(", ")}`);
         }
         if (missingLocal.length > 0) {
            issues.push(
               `Missing .env.local files (database/rag only): ${missingLocal.join(", ")}`,
            );
         }
         if (missingProduction.length > 0) {
            issues.push(
               `Missing .env.production.local files (database/rag only): ${missingProduction.join(", ")}`,
            );
         }

         if (issues.length > 0) {
            throw new Error(
               `${issues.join(". ")}. Run 'bun run scripts/env-setup.ts setup' to create missing environment files.`,
            );
         }
         return "All environment files found";
      },
   },
   {
      name: "TypeScript Configuration",
      fn: () => {
         if (!fs.existsSync("tsconfig.json")) {
            throw new Error("Root tsconfig.json not found");
         }
         return "Found";
      },
   },
   {
      name: "NX Configuration",
      fn: () => {
         if (!fs.existsSync("nx.json")) {
            throw new Error("nx.json not found");
         }
         return "Found";
      },
   },
];

async function runDoctor() {
   console.log(
      chalk.blue.bold("🩺 Running Content Writer Environment Doctor..."),
   );
   console.log("-".repeat(40));

   let allGood = true;

   for (const check of checks) {
      process.stdout.write(`- ${chalk.cyan(check.name)}: `);
      try {
         const result = await Promise.resolve(check.fn());
         console.log(chalk.green(`✓ OK (${result})`));
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
         console.log(chalk.red(`✗ FAILED`));
         console.log(`  ${chalk.red(errorMessage)}`);
         allGood = false;
      }
   }

   console.log("-".repeat(40));
   if (allGood) {
      console.log(chalk.green.bold("✅ Your environment looks good!"));
   } else {
      console.log(
         chalk.red.bold(
            "❌ Some checks failed. Please resolve the issues above.",
         ),
      );
      process.exit(1);
   }
}

runDoctor();

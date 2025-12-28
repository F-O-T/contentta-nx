import path from "node:path";
import { execa } from "execa";
import fs from "fs-extra";
import type {
   PackageJson,
   PackageManager,
   ProjectInfo,
} from "../schemas/project.ts";

const LOCKFILE_TO_PM: Record<string, PackageManager> = {
   "bun.lock": "bun",
   "bun.lockb": "bun",
   "package-lock.json": "npm",
   "pnpm-lock.yaml": "pnpm",
   "yarn.lock": "yarn",
};

const PM_INSTALL_COMMANDS: Record<PackageManager, string[]> = {
   bun: ["bun", "install"],
   npm: ["npm", "install"],
   pnpm: ["pnpm", "install"],
   yarn: ["yarn", "install"],
};

const PM_ADD_COMMANDS: Record<PackageManager, string[]> = {
   bun: ["bun", "add"],
   npm: ["npm", "install"],
   pnpm: ["pnpm", "add"],
   yarn: ["yarn", "add"],
};

export class ProjectError extends Error {
   constructor(message: string) {
      super(message);
      this.name = "ProjectError";
   }
}

/**
 * Detect the package manager by looking for lockfiles
 * Priority: bun > pnpm > yarn > npm (default)
 */
export function detectPackageManager(cwd: string): PackageManager {
   // Check in priority order
   const priorityOrder = [
      "bun.lockb",
      "bun.lock",
      "pnpm-lock.yaml",
      "yarn.lock",
      "package-lock.json",
   ];

   for (const lockfile of priorityOrder) {
      if (fs.existsSync(path.join(cwd, lockfile))) {
         return LOCKFILE_TO_PM[lockfile] as PackageManager;
      }
   }

   // Default to npm
   return "npm";
}

/**
 * Find the nearest package.json by traversing up from cwd
 */
export function findPackageJson(cwd: string): string | null {
   let current = path.resolve(cwd);
   const root = path.parse(current).root;

   while (current !== root) {
      const packageJsonPath = path.join(current, "package.json");
      if (fs.existsSync(packageJsonPath)) {
         return packageJsonPath;
      }
      current = path.dirname(current);
   }

   return null;
}

/**
 * Get project info including package manager and package.json location
 */
export function getProjectInfo(cwd: string): ProjectInfo | null {
   const packageJsonPath = findPackageJson(cwd);

   if (!packageJsonPath) {
      return null;
   }

   const projectRoot = path.dirname(packageJsonPath);
   const packageManager = detectPackageManager(projectRoot);

   return {
      packageJsonPath,
      packageManager,
      projectRoot,
   };
}

/**
 * Read and parse package.json
 */
export async function readPackageJson(
   packageJsonPath: string,
): Promise<PackageJson> {
   const content = await fs.readJson(packageJsonPath);
   return content as PackageJson;
}

/**
 * Add dependencies to package.json
 */
export async function addDependencies(
   packageJsonPath: string,
   deps: Record<string, string>,
): Promise<void> {
   if (Object.keys(deps).length === 0) {
      return;
   }

   const packageJson = await readPackageJson(packageJsonPath);

   packageJson.dependencies = {
      ...packageJson.dependencies,
      ...deps,
   };

   // Sort dependencies alphabetically
   if (packageJson.dependencies) {
      const deps = packageJson.dependencies;
      const sorted = Object.keys(deps)
         .sort()
         .reduce(
            (acc, key) => {
               const value = deps[key];
               if (value) {
                  acc[key] = value;
               }
               return acc;
            },
            {} as Record<string, string>,
         );
      packageJson.dependencies = sorted;
   }

   await fs.writeJson(packageJsonPath, packageJson, { spaces: 3 });
}

/**
 * Run package manager install command
 */
export async function runInstall(
   projectRoot: string,
   packageManager: PackageManager,
): Promise<void> {
   const [cmd, ...args] = PM_INSTALL_COMMANDS[packageManager];

   if (!cmd) {
      throw new ProjectError(`Unknown package manager: ${packageManager}`);
   }

   await execa(cmd, args, {
      cwd: projectRoot,
      stdio: "inherit",
   });
}

/**
 * Run shadcn CLI to add components
 */
export async function runShadcnAdd(
   projectRoot: string,
   components: string[],
): Promise<void> {
   if (components.length === 0) {
      return;
   }

   await execa("npx", ["shadcn@latest", "add", ...components, "--yes"], {
      cwd: projectRoot,
      stdio: "inherit",
   });
}

/**
 * Get the install command string for display
 */
export function getInstallCommandString(
   packageManager: PackageManager,
): string {
   return PM_INSTALL_COMMANDS[packageManager].join(" ");
}

/**
 * Get the add command string for display
 */
export function getAddCommandString(
   packageManager: PackageManager,
   packages: string[],
): string {
   return [...PM_ADD_COMMANDS[packageManager], ...packages].join(" ");
}

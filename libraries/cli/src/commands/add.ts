import path from "node:path";
import fs from "fs-extra";
import ora from "ora";
import pc from "picocolors";
import prompts from "prompts";
import type { BlockDependencies } from "../schemas/registry.ts";
import {
   addDependencies,
   getInstallCommandString,
   getProjectInfo,
   runInstall,
   runShadcnAdd,
} from "../utils/project.ts";
import {
   fetchBlockMetadata,
   RegistryError,
   transformImports,
} from "../utils/registry.ts";

interface AddOptions {
   output?: string;
}

interface AddResult {
   copiedBlocks: string[];
   failedBlocks: string[];
   dependencies: {
      npm: Map<string, string>;
      shadcn: Set<string>;
   };
}

export async function addCommand(
   blocks: string[],
   options: AddOptions,
): Promise<void> {
   console.log(pc.cyan("\nContentta Block Installer\n"));

   if (blocks.length === 0) {
      console.log(
         pc.yellow(
            "No blocks specified. Usage: contentta add <block1> <block2> ...",
         ),
      );
      console.log(pc.dim("Example: contentta add hero-parallax features-one"));
      process.exit(1);
   }

   let outputDir = options.output;

   if (!outputDir) {
      const response = await prompts({
         initial: "./src/components/blocks",
         message: "Output directory:",
         name: "outputDir",
         type: "text",
      });

      if (!response.outputDir) {
         console.log(pc.red("\nOperation cancelled"));
         process.exit(0);
      }

      outputDir = response.outputDir;
   }

   const resolvedOutputDir = path.resolve(process.cwd(), outputDir as string);

   await fs.ensureDir(resolvedOutputDir);

   const result = await fetchAndCopyBlocks(resolvedOutputDir, blocks);

   if (result.copiedBlocks.length === 0) {
      return;
   }

   // Detect project and handle dependencies
   const projectInfo = getProjectInfo(process.cwd());

   if (projectInfo) {
      await handleDependencies(result, projectInfo);
   } else {
      printManualInstructions(result);
   }
}

async function fetchAndCopyBlocks(
   outputDir: string,
   blockIds: string[],
): Promise<AddResult> {
   const spinner = ora("Fetching blocks from registry...").start();

   const result: AddResult = {
      copiedBlocks: [],
      dependencies: {
         npm: new Map<string, string>(),
         shadcn: new Set<string>(),
      },
      failedBlocks: [],
   };

   for (const blockId of blockIds) {
      spinner.text = `Fetching ${blockId}...`;

      try {
         const metadata = await fetchBlockMetadata(blockId);

         const blockPath = path.join(outputDir, `${blockId}.tsx`);
         const componentCode = transformImports(metadata.files.component);

         await fs.writeFile(blockPath, componentCode);

         result.copiedBlocks.push(blockId);

         mergeDependencies(result.dependencies, metadata.dependencies);

         spinner.text = pc.dim(`Copied ${blockId}.tsx`);
      } catch (error) {
         if (error instanceof RegistryError) {
            result.failedBlocks.push(blockId);
            spinner.warn(pc.yellow(`${blockId}: ${error.message}`));
            spinner.start();
         } else {
            throw error;
         }
      }
   }

   if (result.copiedBlocks.length > 0) {
      spinner.succeed(
         pc.green(`Copied ${result.copiedBlocks.length} block(s) successfully`),
      );
   } else {
      spinner.fail(pc.red("No blocks were copied"));
   }

   console.log(pc.dim(`Output: ${outputDir}\n`));

   if (result.failedBlocks.length > 0) {
      console.log(pc.yellow("Failed blocks:"));
      for (const block of result.failedBlocks) {
         console.log(pc.yellow(`  - ${block}`));
      }
      console.log("");
   }

   return result;
}

function mergeDependencies(
   target: AddResult["dependencies"],
   source: BlockDependencies,
): void {
   for (const [pkg, version] of Object.entries(source.npm)) {
      target.npm.set(pkg, version);
   }

   for (const component of source.shadcn) {
      target.shadcn.add(component);
   }
}

async function handleDependencies(
   result: AddResult,
   projectInfo: Awaited<ReturnType<typeof getProjectInfo>>,
): Promise<void> {
   if (!projectInfo) return;

   const hasNpmDeps = result.dependencies.npm.size > 0;
   const hasShadcnDeps = result.dependencies.shadcn.size > 0;

   if (!hasNpmDeps && !hasShadcnDeps) {
      console.log(pc.dim("No additional dependencies required.\n"));
      return;
   }

   // Handle npm dependencies
   if (hasNpmDeps) {
      const depsObj = Object.fromEntries(result.dependencies.npm);

      console.log(pc.cyan("Adding dependencies to package.json:"));
      for (const [pkg, version] of result.dependencies.npm) {
         console.log(pc.dim(`  - ${pkg}@${version}`));
      }
      console.log("");

      await addDependencies(projectInfo.packageJsonPath, depsObj);

      const installCmd = getInstallCommandString(projectInfo.packageManager);
      const { runNpmInstall } = await prompts({
         initial: true,
         message: `Install dependencies now? (${installCmd})`,
         name: "runNpmInstall",
         type: "confirm",
      });

      if (runNpmInstall) {
         const spinner = ora("Installing dependencies...").start();
         try {
            await runInstall(
               projectInfo.projectRoot,
               projectInfo.packageManager,
            );
            spinner.succeed(pc.green("Dependencies installed"));
         } catch {
            spinner.fail(pc.red("Failed to install dependencies"));
            console.log(pc.dim(`  Run manually: ${installCmd}\n`));
         }
      } else {
         console.log(pc.dim(`  Run: ${installCmd}\n`));
      }
   }

   // Handle shadcn dependencies
   if (hasShadcnDeps) {
      const components = [...result.dependencies.shadcn];
      const componentsList = components.join(", ");

      console.log(pc.cyan("shadcn/ui components required:"));
      for (const component of components) {
         console.log(pc.dim(`  - ${component}`));
      }
      console.log("");

      const { runShadcn } = await prompts({
         initial: true,
         message: `Install shadcn components? (${componentsList})`,
         name: "runShadcn",
         type: "confirm",
      });

      if (runShadcn) {
         const spinner = ora("Installing shadcn components...").start();
         try {
            spinner.stop();
            await runShadcnAdd(projectInfo.projectRoot, components);
            console.log(pc.green("✓ shadcn components installed\n"));
         } catch {
            console.log(pc.red("✗ Failed to install shadcn components"));
            console.log(
               pc.dim(
                  `  Run manually: npx shadcn@latest add ${components.join(" ")}\n`,
               ),
            );
         }
      } else {
         console.log(
            pc.dim(`  Run: npx shadcn@latest add ${components.join(" ")}\n`),
         );
      }
   }
}

function printManualInstructions(result: AddResult): void {
   const hasNpmDeps = result.dependencies.npm.size > 0;
   const hasShadcnDeps = result.dependencies.shadcn.size > 0;

   if (!hasNpmDeps && !hasShadcnDeps) {
      return;
   }

   console.log(pc.yellow("Could not find package.json in project.\n"));
   console.log(pc.cyan("Manual installation required:\n"));

   if (hasNpmDeps) {
      console.log(pc.dim("npm packages:"));
      for (const [pkg, version] of result.dependencies.npm) {
         console.log(`  - ${pkg}@${version}`);
      }
      const npmList = [...result.dependencies.npm.entries()]
         .map(([pkg, version]) => `${pkg}@${version}`)
         .join(" ");
      console.log(pc.dim(`\n  bun add ${npmList}\n`));
   }

   if (hasShadcnDeps) {
      console.log(pc.dim("shadcn/ui components:"));
      for (const component of result.dependencies.shadcn) {
         console.log(`  - ${component}`);
      }
      const shadcnList = [...result.dependencies.shadcn].join(" ");
      console.log(pc.dim(`\n  npx shadcn@latest add ${shadcnList}\n`));
   }
}

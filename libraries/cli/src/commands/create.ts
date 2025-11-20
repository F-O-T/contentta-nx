import path from "node:path";
import fs from "fs-extra";
import pc from "picocolors";
import prompts from "prompts";
import { initializeAstroProject } from "../utils/astro-setup";
import { installShadcnComponents } from "../utils/components";
import { generateIndexPage } from "../utils/page-generator";
import { fetchAndInstallBlocks } from "../utils/registry";

interface CreateOptions {
  blocks?: string;
  output?: string;
  theme?: string;
}

export async function createCommand(options: CreateOptions) {
  console.log(pc.cyan("\n🚀 ContentaGen Landing Page Generator\n"));

  let projectName = options.output;
  const blocksString = options.blocks;

  if (!projectName) {
    const response = await prompts({
      initial: "my-landing-page",
      message: "Project name:",
      name: "projectName",
      type: "text",
    });

    if (!response.projectName) {
      console.log(pc.red("\n✖ Project creation cancelled"));
      process.exit(0);
    }

    projectName = response.projectName;
  }

  if (!blocksString) {
    console.log(
      pc.yellow(
        "\n⚠ No blocks specified. Use --blocks flag with block IDs (e.g., --blocks=hero-parallax,features-one,footer-one)"
      )
    );
    process.exit(1);
  }

  if (!projectName) {
    console.log(pc.red("\n✖ Project name is required"));
    process.exit(1);
  }

  const blocks = blocksString.split(",").map((b) => b.trim());
  const projectPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    console.log(pc.red(`\n✖ Directory ${projectName} already exists`));
    process.exit(1);
  }

  try {
    await initializeAstroProject(projectPath, projectName);
    await installShadcnComponents(projectPath, blocks);
    await fetchAndInstallBlocks(projectPath, blocks);
    await generateIndexPage(projectPath, blocks);

    console.log(pc.green(`\n✓ Project created successfully at ${projectName}`));
    console.log(pc.cyan("\nNext steps:"));
    console.log(`  cd ${projectName}`);
    console.log("  npm install");
    console.log("  npm run dev");
  } catch (error) {
    console.error(pc.red("\n✖ Error creating project:"), error);
    if (fs.existsSync(projectPath)) {
      await fs.remove(projectPath);
    }
    process.exit(1);
  }
}

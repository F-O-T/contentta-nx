import fs from "fs-extra";
import ora from "ora";
import path from "node:path";
import pc from "picocolors";

interface BlockMetadata {
  id: string;
  name: string;
  category: string;
  files: {
    component: string;
  };
  dependencies: {
    shadcn: string[];
    npm: Record<string, string>;
  };
}

const REGISTRY_API_URL =
  process.env.CONTENTAGEN_REGISTRY_URL || "http://localhost:9876";

export async function fetchBlockMetadata(
  blockId: string
): Promise<BlockMetadata | null> {
  try {
    const response = await fetch(
      `${REGISTRY_API_URL}/api/registry/blocks/${blockId}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching block ${blockId}:`, error);
    return null;
  }
}

export async function fetchAndInstallBlocks(
  projectPath: string,
  blockIds: string[]
) {
  const spinner = ora("Fetching and installing blocks...").start();

  try {
    const allNpmDeps: Record<string, string> = {};
    const allShadcnComponents = new Set<string>();

    for (const blockId of blockIds) {
      const metadata = await fetchBlockMetadata(blockId);

      if (!metadata) {
        spinner.warn(pc.yellow(`Block ${blockId} not found, skipping...`));
        continue;
      }

      const blockPath = path.join(
        projectPath,
        "src",
        "components",
        "blocks",
        `${blockId}.tsx`
      );

      let componentCode = metadata.files.component;

      componentCode = transformImports(componentCode);

      await fs.writeFile(blockPath, componentCode);

      Object.assign(allNpmDeps, metadata.dependencies.npm);
      metadata.dependencies.shadcn.forEach((comp) =>
        allShadcnComponents.add(comp)
      );
    }

    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = await fs.readJSON(packageJsonPath);

    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...allNpmDeps,
      clsx: "^2.1.1",
      "tailwind-merge": "^3.3.1",
    };

    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });

    spinner.succeed(
      pc.green(`Installed ${blockIds.length} blocks successfully`)
    );

    return Array.from(allShadcnComponents);
  } catch (error) {
    spinner.fail(pc.red("Failed to install blocks"));
    throw error;
  }
}

function transformImports(code: string): string {
  code = code.replace(
    /from ["']\.\.\/components\//g,
    'from "../ui/'
  );

  code = code.replace(
    /from ["']\.\.\/lib\//g,
    'from "../../lib/'
  );

  code = code.replace(
    /from ["']\.\.\/blocks\//g,
    'from "./'
  );

  return code;
}


import path from "node:path";
import { execa } from "execa";
import fs from "fs-extra";
import ora from "ora";
import pc from "picocolors";

async function runShadcnInit(projectPath: string) {
  const componentsJsonPath = path.join(projectPath, "components.json");

  const componentsJson = {
    $schema: "https://ui.shadcn.com/schema.json",
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
      ui: "@/components/ui",
      utils: "@/lib/utils",
    },
    rsc: false,
    style: "new-york",
    tailwind: {
      baseColor: "neutral",
      config: "",
      css: "src/styles/globals.css",
      cssVariables: true,
    },
    tsx: true,
  };

  await fs.writeJSON(componentsJsonPath, componentsJson, { spaces: 2 });
}

async function installShadcnComponent(
  projectPath: string,
  component: string
): Promise<void> {
  await execa(
    "npx",
    ["shadcn@latest", "add", component, "--yes", "--overwrite"],
    {
      cwd: projectPath,
      stdio: "pipe",
    }
  );
}

export async function installShadcnComponents(
  projectPath: string,
  blockIds: string[]
) {
  const spinner = ora("Installing shadcn/ui components...").start();

  try {
    spinner.text = "Setting up shadcn/ui configuration...";
    await runShadcnInit(projectPath);

    const componentsNeeded = new Set<string>();

    for (const blockId of blockIds) {
      const response = await fetch(
        `${process.env.CONTENTAGEN_REGISTRY_URL || "http://localhost:9876"}/api/registry/blocks/${blockId}/dependencies`
      );

      if (response.ok) {
        const deps = await response.json();
        for (const comp of deps.shadcn) {
          componentsNeeded.add(comp);
        }
      }
    }

    if (componentsNeeded.size === 0) {
      spinner.succeed(pc.green("No shadcn components needed"));
      return;
    }

    spinner.text = `Installing ${componentsNeeded.size} shadcn components...`;

    let installed = 0;
    let failed = 0;

    for (const component of componentsNeeded) {
      try {
        spinner.text = `Installing ${component}... (${installed + failed + 1}/${componentsNeeded.size})`;
        await installShadcnComponent(projectPath, component);
        installed++;
      } catch {
        failed++;
      }
    }

    if (failed > 0) {
      spinner.warn(
        pc.yellow(
          `Installed ${installed} components (${failed} failed or skipped)`
        )
      );
    } else {
      spinner.succeed(pc.green(`Installed ${installed} shadcn components`));
    }
  } catch (error) {
    spinner.fail(pc.red("Failed to install shadcn components"));
    throw error;
  }
}

import path from "node:path";
import fs from "fs-extra";
import ora from "ora";
import pc from "picocolors";

export async function initializeAstroProject(
  projectPath: string,
  projectName: string
) {
  const spinner = ora("Initializing Astro project...").start();

  try {
    await fs.ensureDir(projectPath);

    const packageJson = {
      dependencies: {
        "@astrojs/check": "^0.9.4",
        "@astrojs/react": "^4.0.0",
        "@tailwindcss/vite": "^4.0.0",
        "@types/react": "^18.3.18",
        "@types/react-dom": "^18.3.5",
        astro: "^5.1.3",
        motion: "^12.23.24",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        tailwindcss: "^4.0.0",
        typescript: "^5.7.2",
      },
      devDependencies: {},
      name: projectName,
      scripts: {
        astro: "astro",
        build: "astro check && astro build",
        dev: "astro dev",
        preview: "astro preview",
        start: "astro dev",
      },
      type: "module",
      version: "0.0.1",
    };

    await fs.writeJSON(path.join(projectPath, "package.json"), packageJson, {
      spaces: 2,
    });

    const astroConfig = `import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
`;

    await fs.writeFile(path.join(projectPath, "astro.config.mjs"), astroConfig);

    const tsConfig = {
      compilerOptions: {
        baseUrl: ".",
        jsx: "react-jsx",
        jsxImportSource: "react",
        paths: {
          "@/*": ["./src/*"],
        },
      },
      extends: "astro/tsconfigs/strict",
    };

    await fs.writeJSON(path.join(projectPath, "tsconfig.json"), tsConfig, {
      spaces: 2,
    });

    await fs.ensureDir(path.join(projectPath, "src", "pages"));
    await fs.ensureDir(path.join(projectPath, "src", "components", "ui"));
    await fs.ensureDir(path.join(projectPath, "src", "components", "blocks"));
    await fs.ensureDir(path.join(projectPath, "src", "layouts"));
    await fs.ensureDir(path.join(projectPath, "src", "lib"));
    await fs.ensureDir(path.join(projectPath, "src", "styles"));
    await fs.ensureDir(path.join(projectPath, "public"));

    const layoutContent = `---
interface Props {
  title?: string;
}

const { title = "Landing Page" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
`;

    await fs.writeFile(
      path.join(projectPath, "src", "layouts", "Layout.astro"),
      layoutContent
    );

    const globalsCss = `@import "tailwindcss";

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(0 0% 3.9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(0 0% 3.9%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(0 0% 3.9%);
  --color-primary: hsl(0 0% 9%);
  --color-primary-foreground: hsl(0 0% 98%);
  --color-secondary: hsl(0 0% 96.1%);
  --color-secondary-foreground: hsl(0 0% 9%);
  --color-muted: hsl(0 0% 96.1%);
  --color-muted-foreground: hsl(0 0% 45.1%);
  --color-accent: hsl(0 0% 96.1%);
  --color-accent-foreground: hsl(0 0% 9%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-border: hsl(0 0% 89.8%);
  --color-input: hsl(0 0% 89.8%);
  --color-ring: hsl(0 0% 3.9%);
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: hsl(0 0% 3.9%);
    --color-foreground: hsl(0 0% 98%);
    --color-card: hsl(0 0% 3.9%);
    --color-card-foreground: hsl(0 0% 98%);
    --color-popover: hsl(0 0% 3.9%);
    --color-popover-foreground: hsl(0 0% 98%);
    --color-primary: hsl(0 0% 98%);
    --color-primary-foreground: hsl(0 0% 9%);
    --color-secondary: hsl(0 0% 14.9%);
    --color-secondary-foreground: hsl(0 0% 98%);
    --color-muted: hsl(0 0% 14.9%);
    --color-muted-foreground: hsl(0 0% 63.9%);
    --color-accent: hsl(0 0% 14.9%);
    --color-accent-foreground: hsl(0 0% 98%);
    --color-destructive: hsl(0 62.8% 30.6%);
    --color-destructive-foreground: hsl(0 0% 98%);
    --color-border: hsl(0 0% 14.9%);
    --color-input: hsl(0 0% 14.9%);
    --color-ring: hsl(0 0% 83.1%);
  }
}
`;

    await fs.writeFile(
      path.join(projectPath, "src", "styles", "globals.css"),
      globalsCss
    );

    const utilsContent = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

    await fs.writeFile(
      path.join(projectPath, "src", "lib", "utils.ts"),
      utilsContent
    );

    spinner.succeed(pc.green("Astro project initialized"));
  } catch (error) {
    spinner.fail(pc.red("Failed to initialize Astro project"));
    throw error;
  }
}

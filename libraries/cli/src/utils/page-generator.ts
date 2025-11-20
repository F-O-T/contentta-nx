import path from "node:path";
import fs from "fs-extra";
import ora from "ora";
import pc from "picocolors";

const BLOCK_NAME_MAP: Record<string, string> = {
  "features-one": "FeaturesOne",
  "footer-one": "FooterSection",
  "hero-parallax": "HeroParallax",
  "hero-section-1": "HeroSection1",
  "pricing-table": "PricingTable",
};

export async function generateIndexPage(
  projectPath: string,
  blockIds: string[]
) {
  const spinner = ora("Generating landing page...").start();

  try {
    const imports: string[] = [];
    const components: string[] = [];

    for (const blockId of blockIds) {
      const componentName = BLOCK_NAME_MAP[blockId];
      if (componentName) {
        imports.push(
          `import { ${componentName} } from '../components/blocks/${blockId}';`
        );
        components.push(`  <${componentName} client:load />`);
      }
    }

    const indexContent = `---
import Layout from '../layouts/Layout.astro';
${imports.join("\n")}
import '../styles/globals.css';
---

<Layout title="Landing Page">
${components.join("\n")}
</Layout>
`;

    const indexPath = path.join(projectPath, "src", "pages", "index.astro");
    await fs.writeFile(indexPath, indexContent);

    spinner.succeed(pc.green("Landing page generated"));
  } catch (error) {
    spinner.fail(pc.red("Failed to generate landing page"));
    throw error;
  }
}

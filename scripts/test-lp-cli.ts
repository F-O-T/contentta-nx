#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";

const TEST_PROJECT_NAME = "test-landing-page";
const TEST_BLOCKS = "hero-parallax,features-one,footer-one";

async function main() {
  console.log("🧪 Testing Landing Page Builder CLI\n");

  console.log("Step 1: Checking if test project exists...");
  const testProjectPath = join(process.cwd(), TEST_PROJECT_NAME);
  if (existsSync(testProjectPath)) {
    console.log("⚠ Test project already exists. Removing...");
    await rm(testProjectPath, { force: true, recursive: true });
  }
  console.log("✓ Ready to create test project\n");

  console.log("Step 2: Creating test landing page...");
  console.log(
    `Command: bun packages/cli/src/index.ts create --blocks=${TEST_BLOCKS} --output=${TEST_PROJECT_NAME}\n`
  );

  try {
    await $`bun packages/cli/src/index.ts create --blocks=${TEST_BLOCKS} --output=${TEST_PROJECT_NAME}`;
    console.log("✓ Project created successfully\n");
  } catch (error) {
    console.error("✗ Failed to create project:", error);
    process.exit(1);
  }

  console.log("Step 3: Verifying project structure...");
  const checks = [
    "package.json",
    "astro.config.mjs",
    "tsconfig.json",
    "src/pages/index.astro",
    "src/layouts/Layout.astro",
    "src/lib/utils.ts",
    "src/styles/globals.css",
    "src/components/blocks/hero-parallax.tsx",
    "src/components/blocks/features-one.tsx",
    "src/components/blocks/footer-one.tsx",
  ];

  let allValid = true;
  for (const file of checks) {
    const filePath = join(testProjectPath, file);
    const exists = existsSync(filePath);
    console.log(`  ${exists ? "✓" : "✗"} ${file}`);
    if (!exists) allValid = false;
  }

  if (!allValid) {
    console.error("\n✗ Project structure validation failed");
    process.exit(1);
  }

  console.log("\n✓ Project structure validated\n");

  console.log("Step 4: Installing dependencies...");
  await $`cd ${TEST_PROJECT_NAME} && npm install`;
  console.log("✓ Dependencies installed\n");

  console.log("✅ All tests passed!\n");
  console.log("Next steps:");
  console.log(`  cd ${TEST_PROJECT_NAME}`);
  console.log("  npm run dev");
  console.log("\nTo clean up the test project:");
  console.log(`  rm -rf ${TEST_PROJECT_NAME}`);
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

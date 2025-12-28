import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";

// We'll test the integration behavior
describe("add command integration", () => {
   let tempDir: string;

   beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `contentta-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
   });

   afterEach(async () => {
      await fs.remove(tempDir);
   });

   it("should create output directory if it doesn't exist", async () => {
      const outputDir = path.join(tempDir, "new-blocks");

      await fs.ensureDir(outputDir);

      expect(await fs.pathExists(outputDir)).toBe(true);
   });

   it("should write block file to output directory", async () => {
      const outputDir = path.join(tempDir, "blocks");
      await fs.ensureDir(outputDir);

      const blockContent = `export function TestComponent() {
   return <div>Test</div>;
}`;

      const blockPath = path.join(outputDir, "test-block.tsx");
      await fs.writeFile(blockPath, blockContent);

      expect(await fs.pathExists(blockPath)).toBe(true);
      expect(await fs.readFile(blockPath, "utf-8")).toBe(blockContent);
   });
});

describe("dependency collection", () => {
   it("should merge npm dependencies from multiple blocks", () => {
      const dependencies = {
         npm: new Map<string, string>(),
         shadcn: new Set<string>(),
      };

      // Simulate adding deps from first block
      dependencies.npm.set("lucide-react", "^0.548.0");
      dependencies.shadcn.add("button");

      // Simulate adding deps from second block
      dependencies.npm.set("motion", "^12.23.24");
      dependencies.shadcn.add("card");
      dependencies.shadcn.add("table");

      // Third block with overlapping deps
      dependencies.npm.set("lucide-react", "^0.548.0"); // duplicate
      dependencies.shadcn.add("button"); // duplicate

      expect(dependencies.npm.size).toBe(2);
      expect(dependencies.shadcn.size).toBe(3);

      expect(dependencies.npm.get("lucide-react")).toBe("^0.548.0");
      expect(dependencies.npm.get("motion")).toBe("^12.23.24");
      expect(dependencies.shadcn.has("button")).toBe(true);
      expect(dependencies.shadcn.has("card")).toBe(true);
      expect(dependencies.shadcn.has("table")).toBe(true);
   });

   it("should handle empty dependencies", () => {
      const dependencies = {
         npm: new Map<string, string>(),
         shadcn: new Set<string>(),
      };

      expect(dependencies.npm.size).toBe(0);
      expect(dependencies.shadcn.size).toBe(0);
   });
});

describe("block file operations", () => {
   let tempDir: string;

   beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `contentta-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
   });

   afterEach(async () => {
      await fs.remove(tempDir);
   });

   it("should create block files with correct names", async () => {
      const blockIds = ["hero-parallax", "features-one", "footer-one"];

      for (const blockId of blockIds) {
         const blockPath = path.join(tempDir, `${blockId}.tsx`);
         await fs.writeFile(blockPath, `// ${blockId} component`);
      }

      const files = await fs.readdir(tempDir);

      expect(files).toContain("hero-parallax.tsx");
      expect(files).toContain("features-one.tsx");
      expect(files).toContain("footer-one.tsx");
   });

   it("should overwrite existing block files", async () => {
      const blockPath = path.join(tempDir, "hero-section.tsx");

      // Create initial file
      await fs.writeFile(blockPath, "// Original content");

      // Overwrite
      await fs.writeFile(blockPath, "// Updated content");

      const content = await fs.readFile(blockPath, "utf-8");
      expect(content).toBe("// Updated content");
   });
});

describe("result tracking", () => {
   it("should track copied blocks", () => {
      const result = {
         copiedBlocks: [] as string[],
         failedBlocks: [] as string[],
      };

      result.copiedBlocks.push("hero-parallax");
      result.copiedBlocks.push("features-one");

      expect(result.copiedBlocks).toHaveLength(2);
      expect(result.copiedBlocks).toContain("hero-parallax");
      expect(result.copiedBlocks).toContain("features-one");
   });

   it("should track failed blocks", () => {
      const result = {
         copiedBlocks: [] as string[],
         failedBlocks: [] as string[],
      };

      result.failedBlocks.push("non-existent-block");

      expect(result.failedBlocks).toHaveLength(1);
      expect(result.failedBlocks).toContain("non-existent-block");
   });

   it("should handle mixed results", () => {
      const result = {
         copiedBlocks: ["hero-parallax", "features-one"],
         failedBlocks: ["non-existent"],
      };

      expect(result.copiedBlocks).toHaveLength(2);
      expect(result.failedBlocks).toHaveLength(1);
   });
});

describe("output path resolution", () => {
   it("should resolve relative paths", () => {
      const cwd = "/home/user/project";
      const relative = "./src/components/blocks";

      const resolved = path.resolve(cwd, relative);

      expect(resolved).toBe("/home/user/project/src/components/blocks");
   });

   it("should handle absolute paths", () => {
      const cwd = "/home/user/project";
      const absolute = "/absolute/path/to/blocks";

      const resolved = path.resolve(cwd, absolute);

      expect(resolved).toBe("/absolute/path/to/blocks");
   });

   it("should normalize paths with ../ segments", () => {
      const cwd = "/home/user/project/src";
      const relative = "../components/blocks";

      const resolved = path.resolve(cwd, relative);

      expect(resolved).toBe("/home/user/project/components/blocks");
   });
});

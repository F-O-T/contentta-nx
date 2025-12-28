import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import {
   addDependencies,
   detectPackageManager,
   findPackageJson,
   getAddCommandString,
   getInstallCommandString,
   getProjectInfo,
   readPackageJson,
} from "../utils/project.ts";

describe("detectPackageManager", () => {
   let tempDir: string;

   beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `contentta-pm-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
   });

   afterEach(async () => {
      await fs.remove(tempDir);
   });

   it("should detect bun from bun.lockb", async () => {
      await fs.writeFile(path.join(tempDir, "bun.lockb"), "");

      expect(detectPackageManager(tempDir)).toBe("bun");
   });

   it("should detect bun from bun.lock", async () => {
      await fs.writeFile(path.join(tempDir, "bun.lock"), "");

      expect(detectPackageManager(tempDir)).toBe("bun");
   });

   it("should detect pnpm from pnpm-lock.yaml", async () => {
      await fs.writeFile(path.join(tempDir, "pnpm-lock.yaml"), "");

      expect(detectPackageManager(tempDir)).toBe("pnpm");
   });

   it("should detect yarn from yarn.lock", async () => {
      await fs.writeFile(path.join(tempDir, "yarn.lock"), "");

      expect(detectPackageManager(tempDir)).toBe("yarn");
   });

   it("should detect npm from package-lock.json", async () => {
      await fs.writeFile(path.join(tempDir, "package-lock.json"), "{}");

      expect(detectPackageManager(tempDir)).toBe("npm");
   });

   it("should default to npm when no lockfile exists", () => {
      expect(detectPackageManager(tempDir)).toBe("npm");
   });

   it("should prioritize bun over other lockfiles", async () => {
      await fs.writeFile(path.join(tempDir, "bun.lockb"), "");
      await fs.writeFile(path.join(tempDir, "yarn.lock"), "");
      await fs.writeFile(path.join(tempDir, "package-lock.json"), "{}");

      expect(detectPackageManager(tempDir)).toBe("bun");
   });

   it("should prioritize pnpm over yarn and npm", async () => {
      await fs.writeFile(path.join(tempDir, "pnpm-lock.yaml"), "");
      await fs.writeFile(path.join(tempDir, "yarn.lock"), "");
      await fs.writeFile(path.join(tempDir, "package-lock.json"), "{}");

      expect(detectPackageManager(tempDir)).toBe("pnpm");
   });
});

describe("findPackageJson", () => {
   let tempDir: string;

   beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `contentta-pkg-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
   });

   afterEach(async () => {
      await fs.remove(tempDir);
   });

   it("should find package.json in current directory", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      await fs.writeJson(packageJsonPath, { name: "test" });

      expect(findPackageJson(tempDir)).toBe(packageJsonPath);
   });

   it("should find package.json in parent directory", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      await fs.writeJson(packageJsonPath, { name: "test" });

      const subDir = path.join(tempDir, "src", "components");
      await fs.ensureDir(subDir);

      expect(findPackageJson(subDir)).toBe(packageJsonPath);
   });

   it("should return null when no package.json exists", () => {
      expect(findPackageJson(tempDir)).toBeNull();
   });

   it("should find closest package.json in nested structure", async () => {
      // Create root package.json
      await fs.writeJson(path.join(tempDir, "package.json"), { name: "root" });

      // Create nested package.json
      const nestedDir = path.join(tempDir, "packages", "ui");
      await fs.ensureDir(nestedDir);
      const nestedPackageJson = path.join(nestedDir, "package.json");
      await fs.writeJson(nestedPackageJson, { name: "ui" });

      // Should find the closest one
      expect(findPackageJson(nestedDir)).toBe(nestedPackageJson);
   });
});

describe("getProjectInfo", () => {
   let tempDir: string;

   beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `contentta-proj-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
   });

   afterEach(async () => {
      await fs.remove(tempDir);
   });

   it("should return project info when package.json exists", async () => {
      await fs.writeJson(path.join(tempDir, "package.json"), { name: "test" });
      await fs.writeFile(path.join(tempDir, "bun.lockb"), "");

      const info = getProjectInfo(tempDir);

      expect(info).not.toBeNull();
      expect(info?.packageManager).toBe("bun");
      expect(info?.projectRoot).toBe(tempDir);
      expect(info?.packageJsonPath).toBe(path.join(tempDir, "package.json"));
   });

   it("should return null when no package.json exists", () => {
      const info = getProjectInfo(tempDir);

      expect(info).toBeNull();
   });
});

describe("readPackageJson", () => {
   let tempDir: string;

   beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `contentta-read-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
   });

   afterEach(async () => {
      await fs.remove(tempDir);
   });

   it("should read and parse package.json", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      await fs.writeJson(packageJsonPath, {
         dependencies: { react: "^18.0.0" },
         name: "test-project",
         version: "1.0.0",
      });

      const result = await readPackageJson(packageJsonPath);

      expect(result.name).toBe("test-project");
      expect(result.version).toBe("1.0.0");
      expect(result.dependencies?.react).toBe("^18.0.0");
   });
});

describe("addDependencies", () => {
   let tempDir: string;

   beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `contentta-add-test-${Date.now()}`);
      await fs.ensureDir(tempDir);
   });

   afterEach(async () => {
      await fs.remove(tempDir);
   });

   it("should add new dependencies to package.json", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      await fs.writeJson(packageJsonPath, {
         dependencies: { react: "^18.0.0" },
         name: "test",
      });

      await addDependencies(packageJsonPath, {
         "lucide-react": "^0.548.0",
         motion: "^12.23.24",
      });

      const result = await fs.readJson(packageJsonPath);

      expect(result.dependencies["lucide-react"]).toBe("^0.548.0");
      expect(result.dependencies.motion).toBe("^12.23.24");
      expect(result.dependencies.react).toBe("^18.0.0");
   });

   it("should sort dependencies alphabetically", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      await fs.writeJson(packageJsonPath, {
         dependencies: { zod: "^3.0.0" },
         name: "test",
      });

      await addDependencies(packageJsonPath, {
         axios: "^1.0.0",
         motion: "^12.0.0",
      });

      const result = await fs.readJson(packageJsonPath);
      const keys = Object.keys(result.dependencies);

      expect(keys).toEqual(["axios", "motion", "zod"]);
   });

   it("should create dependencies object if it doesn't exist", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      await fs.writeJson(packageJsonPath, { name: "test" });

      await addDependencies(packageJsonPath, { motion: "^12.0.0" });

      const result = await fs.readJson(packageJsonPath);

      expect(result.dependencies.motion).toBe("^12.0.0");
   });

   it("should not modify file if no dependencies provided", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      const original = { dependencies: { react: "^18.0.0" }, name: "test" };
      await fs.writeJson(packageJsonPath, original);

      await addDependencies(packageJsonPath, {});

      const result = await fs.readJson(packageJsonPath);

      expect(result).toEqual(original);
   });

   it("should override existing dependency versions", async () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      await fs.writeJson(packageJsonPath, {
         dependencies: { motion: "^11.0.0" },
         name: "test",
      });

      await addDependencies(packageJsonPath, { motion: "^12.23.24" });

      const result = await fs.readJson(packageJsonPath);

      expect(result.dependencies.motion).toBe("^12.23.24");
   });
});

describe("getInstallCommandString", () => {
   it("should return correct command for bun", () => {
      expect(getInstallCommandString("bun")).toBe("bun install");
   });

   it("should return correct command for npm", () => {
      expect(getInstallCommandString("npm")).toBe("npm install");
   });

   it("should return correct command for yarn", () => {
      expect(getInstallCommandString("yarn")).toBe("yarn install");
   });

   it("should return correct command for pnpm", () => {
      expect(getInstallCommandString("pnpm")).toBe("pnpm install");
   });
});

describe("getAddCommandString", () => {
   it("should return correct add command for bun", () => {
      expect(getAddCommandString("bun", ["react", "motion"])).toBe(
         "bun add react motion",
      );
   });

   it("should return correct add command for npm", () => {
      expect(getAddCommandString("npm", ["react"])).toBe("npm install react");
   });

   it("should return correct add command for yarn", () => {
      expect(getAddCommandString("yarn", ["react"])).toBe("yarn add react");
   });

   it("should return correct add command for pnpm", () => {
      expect(getAddCommandString("pnpm", ["react"])).toBe("pnpm add react");
   });

   it("should handle empty packages array", () => {
      expect(getAddCommandString("bun", [])).toBe("bun add");
   });
});

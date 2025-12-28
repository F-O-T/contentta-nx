import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import {
   extractForVersion,
   parseAllVersions,
   readChangelog,
} from "./extract-changelog";

const GITHUB_API = "https://api.github.com";
const LIBRARIES_DIR = "libraries";

interface Library {
   name: string;
   version: string;
   dirName: string;
   path: string;
   changelogBody: string;
   tag: string;
}

interface ReleaseResult {
   library: Library;
   success: boolean;
   error?: string;
   steps: {
      build: "success" | "failed" | "skipped";
      githubRelease: "success" | "failed" | "skipped";
      npmPublish: "success" | "failed" | "skipped";
   };
}

function ownerRepo() {
   const repo = process.env.GITHUB_REPOSITORY;
   if (!repo) throw new Error("GITHUB_REPOSITORY not set");
   const [owner, repoName] = repo.split("/");
   return { owner, repo: repoName };
}

async function githubFetch(
   url: string,
   method = "GET",
   body: unknown = null,
   token?: string,
) {
   const headers: Record<string, string> = {
      "User-Agent": "library-release-bot",
      Accept: "application/vnd.github+json",
   };
   if (token) headers.Authorization = `token ${token}`;
   const opts: RequestInit = { method, headers };
   if (body) {
      opts.body = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
   }
   const res = await fetch(url, opts);
   const text = await res.text();
   let json: unknown;
   try {
      json = text ? JSON.parse(text) : null;
   } catch {
      json = text;
   }
   if (!res.ok) {
      const err = new Error(
         `GitHub API ${res.status} ${res.statusText}: ${JSON.stringify(json)}`,
      ) as Error & { status: number; body: unknown };
      err.status = res.status;
      err.body = json;
      throw err;
   }
   return json;
}

async function tagExists(tag: string, token: string): Promise<boolean> {
   const { owner, repo } = ownerRepo();
   const url = `${GITHUB_API}/repos/${owner}/${repo}/git/refs/tags/${encodeURIComponent(tag)}`;
   try {
      await githubFetch(url, "GET", null, token);
      return true;
   } catch (err: unknown) {
      if ((err as { status?: number }).status === 404) return false;
      throw err;
   }
}

async function isVersionPublished(
   pkgName: string,
   version: string,
): Promise<boolean> {
   try {
      const output = execSync(`npm view ${pkgName} versions --json`, {
         encoding: "utf8",
         stdio: ["pipe", "pipe", "pipe"],
      });
      const versions = JSON.parse(output);
      if (Array.isArray(versions)) {
         return versions.includes(version);
      }
      return versions === version;
   } catch {
      return false;
   }
}

async function discoverLibraries(): Promise<Library[]> {
   const libraries: Library[] = [];
   const librariesPath = path.resolve(LIBRARIES_DIR);

   let entries: string[];
   try {
      entries = await fs.readdir(librariesPath);
   } catch {
      console.log(`📁 No ${LIBRARIES_DIR}/ directory found`);
      return [];
   }

   for (const entry of entries) {
      const libPath = path.join(librariesPath, entry);
      const stat = await fs.stat(libPath);
      if (!stat.isDirectory()) continue;

      const pkgJsonPath = path.join(libPath, "package.json");
      const changelogPath = path.join(libPath, "CHANGELOG.md");

      try {
         await fs.access(pkgJsonPath);
         await fs.access(changelogPath);
      } catch {
         continue;
      }

      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf8"));
      if (pkgJson.private === true) continue;

      const changelog = await readChangelog(changelogPath);
      const versions = parseAllVersions(changelog);

      if (versions.length === 0) {
         console.log(`  ⚠️  ${pkgJson.name}: No versions in CHANGELOG.md`);
         continue;
      }

      const latestEntry = versions[0];
      if (!latestEntry) {
         console.log(`  ⚠️  ${pkgJson.name}: No versions in CHANGELOG.md`);
         continue;
      }

      const latestChangelogVersion = latestEntry.version;

      if (latestChangelogVersion !== pkgJson.version) {
         console.log(
            `  ⚠️  ${pkgJson.name}: CHANGELOG version (${latestChangelogVersion}) doesn't match package.json (${pkgJson.version})`,
         );
         continue;
      }

      const changelogBody = extractForVersion(changelog, pkgJson.version);
      if (!changelogBody) {
         console.log(
            `  ⚠️  ${pkgJson.name}: No changelog entry for version ${pkgJson.version}`,
         );
         continue;
      }

      libraries.push({
         name: pkgJson.name,
         version: pkgJson.version,
         dirName: entry,
         path: libPath,
         changelogBody,
         tag: `${pkgJson.name}@${pkgJson.version}`,
      });
   }

   return libraries;
}

async function getLibrariesToRelease(
   libraries: Library[],
   token: string,
   specificLibrary?: string,
): Promise<Library[]> {
   const toRelease: Library[] = [];

   for (const lib of libraries) {
      if (specificLibrary && lib.dirName !== specificLibrary) {
         continue;
      }

      const exists = await tagExists(lib.tag, token);
      if (exists) {
         console.log(`  ${lib.tag} - tag exists, skipping`);
      } else {
         console.log(`  ${lib.tag} - needs release`);
         toRelease.push(lib);
      }
   }

   return toRelease;
}

async function createGitHubRelease(
   lib: Library,
   token: string,
): Promise<string> {
   const { owner, repo } = ownerRepo();
   const createUrl = `${GITHUB_API}/repos/${owner}/${repo}/releases`;
   const body = {
      tag_name: lib.tag,
      name: lib.tag,
      body: lib.changelogBody,
      draft: false,
      prerelease: false,
   };
   const result = (await githubFetch(createUrl, "POST", body, token)) as {
      html_url?: string;
      id: string;
   };
   return result.html_url || result.id;
}

function setupNpmAuth() {
   const npmToken = process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN;
   if (npmToken) {
      execSync(`npm config set //registry.npmjs.org/:_authToken ${npmToken}`, {
         stdio: "pipe",
      });
   }
}

async function releaseLibrary(
   lib: Library,
   token: string,
): Promise<ReleaseResult> {
   const result: ReleaseResult = {
      library: lib,
      success: false,
      steps: {
         build: "skipped",
         githubRelease: "skipped",
         npmPublish: "skipped",
      },
   };

   try {
      console.log(`  ├─ Building...`);
      execSync("bun run build", {
         cwd: lib.path,
         stdio: "inherit",
      });
      result.steps.build = "success";
      console.log(`  │  ✓ Build complete`);
   } catch (err) {
      result.steps.build = "failed";
      result.error = `Build failed: ${err instanceof Error ? err.message : String(err)}`;
      console.log(`  │  ✗ Build failed`);
      return result;
   }

   try {
      console.log(`  ├─ Creating GitHub release...`);
      const releaseUrl = await createGitHubRelease(lib, token);
      result.steps.githubRelease = "success";
      console.log(`  │  ✓ Release created: ${releaseUrl}`);
   } catch (err) {
      result.steps.githubRelease = "failed";
      result.error = `GitHub release failed: ${err instanceof Error ? err.message : String(err)}`;
      console.log(`  │  ✗ GitHub release failed`);
      return result;
   }

   try {
      const alreadyPublished = await isVersionPublished(lib.name, lib.version);
      if (alreadyPublished) {
         console.log(`  └─ Already published to npm, skipping`);
         result.steps.npmPublish = "success";
      } else {
         console.log(`  └─ Publishing to npm...`);
         execSync("npm publish --access public", {
            cwd: lib.path,
            stdio: "inherit",
         });
         result.steps.npmPublish = "success";
         console.log(`     ✓ Published to npm`);
      }
   } catch (err) {
      result.steps.npmPublish = "failed";
      result.error = `npm publish failed: ${err instanceof Error ? err.message : String(err)}`;
      console.log(`     ✗ npm publish failed`);
      return result;
   }

   result.success = true;
   return result;
}

function printSummary(results: ReleaseResult[]) {
   console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
   console.log("📊 Release Summary");
   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

   const successful = results.filter((r) => r.success);
   const failed = results.filter((r) => !r.success);

   console.log(`✅ Successful: ${successful.length}`);
   for (const r of successful) {
      console.log(`   • ${r.library.tag}`);
   }

   console.log(`❌ Failed: ${failed.length}`);
   for (const r of failed) {
      console.log(`   • ${r.library.tag}`);
      console.log(`     Error: ${r.error}`);
      console.log(
         `     Steps: build=${r.steps.build}, github=${r.steps.githubRelease}, npm=${r.steps.npmPublish}`,
      );
   }

   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

export async function run() {
   const token = process.env.GITHUB_TOKEN;
   if (!token) throw new Error("GITHUB_TOKEN required");

   setupNpmAuth();

   const specificLibrary = process.env.INPUT_LIBRARY || undefined;

   console.log("📦 Discovering libraries...");
   const libraries = await discoverLibraries();

   if (libraries.length === 0) {
      console.log("No publishable libraries found.");
      return;
   }

   for (const lib of libraries) {
      console.log(`  Found: ${lib.name} (v${lib.version}) at ${lib.dirName}`);
   }

   console.log("\n🔍 Checking for unreleased versions...");
   const toRelease = await getLibrariesToRelease(
      libraries,
      token,
      specificLibrary,
   );

   if (toRelease.length === 0) {
      console.log("\n✨ All libraries are up to date. Nothing to release.");
      return;
   }

   console.log(`\n🚀 Releasing ${toRelease.length} library(ies)...\n`);

   const results: ReleaseResult[] = [];

   for (let i = 0; i < toRelease.length; i++) {
      const lib = toRelease[i] as Library;
      console.log(`[${i + 1}/${toRelease.length}] ${lib.tag}`);
      const result = await releaseLibrary(lib, token);
      results.push(result);
      console.log("");
   }

   printSummary(results);

   const hasFailures = results.some((r) => !r.success);
   if (hasFailures) {
      process.exit(1);
   }
}

if (
   import.meta.url === `file://${process.argv[1]}` ||
   process.argv[1]?.endsWith("release-library.ts")
) {
   run().catch((err) => {
      console.error(err);
      process.exit(1);
   });
}

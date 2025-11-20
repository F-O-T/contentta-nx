import { execSync } from "child_process";
import fs from "fs/promises";
import { extractForVersion, readChangelog } from "./extract-changelog";

export async function isVersionPublished(
	pkgName: string,
	version: string,
): Promise<boolean> {
	try {
		const output = execSync(`npm view ${pkgName} versions --json`, {
			encoding: "utf8",
		});
		const versions = JSON.parse(output);
		return versions.includes(version);
	} catch (err) {
		// If package not found, treat as not published
		return false;
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPublication(
	pkgName: string,
	version: string,
	maxAttempts = 6,
	delayMs = 5000,
): Promise<boolean> {
	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		if (await isVersionPublished(pkgName, version)) {
			return true;
		}
		if (attempt < maxAttempts - 1) {
			await sleep(delayMs);
		}
	}
	return false;
}

async function main() {
	const pkgJson = JSON.parse(await fs.readFile("package.json", "utf8"));
	const pkgName = pkgJson.name;
	const version = pkgJson.version;

	const changelog = await readChangelog();
	const changelogEntry = extractForVersion(changelog, version);
	if (!changelogEntry) {
		console.error(`No changelog entry found for version ${version}`);
		process.exit(1);
	}

	const published = await isVersionPublished(pkgName, version);
	if (published) {
		console.log(`Version ${version} is already published to npm.`);
		process.exit(0);
	}

	// Build step
	console.log("Building the app...");
	execSync("bun run build", { stdio: "inherit" });

	// Publish step
	console.log("Publishing to npm...");
	try {
		execSync("npm publish --access public", { stdio: "inherit" });
	} catch (error) {
		console.warn(
			"npm publish failed, verifying whether the version is already available...",
		);
		const publishedAfterFailure = await waitForPublication(pkgName, version);
		if (publishedAfterFailure) {
			console.log(
				`Version ${version} is already available on npm. Treating publish as successful.`,
			);
			return;
		}
		throw error;
	}

	console.log(`Published version ${version} to npm.`);
}

if (
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("publish-release.ts")
) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}

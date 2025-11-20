import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as extract from "../scripts/extract-changelog";

const FIXTURE_CHANGELOG = `# Changelog

## [1.0.0] - 2024-01-01

- Initial release

## [0.9.0] - 2023-12-01

- Beta`;

describe("extract-changelog", () => {
	it("reads changelog file", async () => {
		const tmp = path.resolve("CHANGELOG.test.md");
		await fs.writeFile(tmp, FIXTURE_CHANGELOG);
		const text = await extract.readChangelog(tmp);
		expect(text).toContain("Initial release");
		await fs.unlink(tmp);
	});

	it("extracts entry for version", () => {
		const entry = extract.extractForVersion(FIXTURE_CHANGELOG, "1.0.0");
		expect(entry).toContain("Initial release");
	});

	it("returns null for missing version", () => {
		const entry = extract.extractForVersion(FIXTURE_CHANGELOG, "2.0.0");
		expect(entry).toBeNull();
	});

	it("reads version from package.json", async () => {
		const tmp = path.resolve("package.test.json");
		await fs.writeFile(tmp, JSON.stringify({ version: "9.9.9" }));
		const v = await extract.extractVersionFromPackageJson(tmp);
		expect(v).toBe("9.9.9");
		await fs.unlink(tmp);
	});
});

describe("create-release", () => {
	const FIXTURE_FULL_CHANGELOG = `# Changelog

## [1.1.0] - 2024-02-01

- Patch

## [1.0.0] - 2024-01-01

- Initial release

## [0.9.0] - 2023-12-01

- Beta`;

	const envBackup = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...envBackup } as NodeJS.ProcessEnv;
	});

	afterEach(() => {
		process.env = envBackup;
		vi.restoreAllMocks();
	});

	it("backfills missing releases only", async () => {
		process.env.GITHUB_TOKEN = "fake";
		process.env.GITHUB_REPOSITORY = "owner/repo";
		process.env.BACKFILL = "true";

		// mock readChangelog to return full changelog
		const readStub = vi
			.spyOn(extract, "readChangelog")
			.mockResolvedValue(FIXTURE_FULL_CHANGELOG);

		// import create-release fresh
		const mod = await import("../scripts/create-release");

		// mock global fetch to simulate GitHub API and Discord
		const origFetch = globalThis.fetch;
		globalThis.fetch = vi
			.fn()
			.mockImplementation(
				async (url: string, opts?: { [key: string]: unknown }) => {
					const u = String(url);
					const method = opts?.method || "GET";
					// simulate GET release tag checks
					if (u.includes("/releases/tags/v1.1.0") && method === "GET") {
						return {
							ok: false,
							status: 404,
							statusText: "Not Found",
							text: async () => JSON.stringify({ message: "Not Found" }),
						};
					}
					if (u.includes("/releases/tags/v1.0.0") && method === "GET") {
						return {
							ok: true,
							status: 200,
							statusText: "OK",
							text: async () => JSON.stringify({ id: 111 }),
						};
					}
					if (u.includes("/releases/tags/v0.9.0") && method === "GET") {
						return {
							ok: true,
							status: 200,
							statusText: "OK",
							text: async () => JSON.stringify({ id: 110 }),
						};
					}
					// simulate POST to create release
					if (u.endsWith("/releases") && method === "POST") {
						return {
							ok: true,
							status: 201,
							statusText: "Created",
							text: async () =>
								JSON.stringify({
									id: 123,
									html_url: "https://example.com/1.1.0",
								}),
						};
					}
					// discord webhook
					if (u.includes("discord.com") && method === "POST") {
						return { ok: true, status: 204, text: async () => "" };
					}
					return {
						ok: true,
						status: 200,
						text: async () => JSON.stringify({}),
					};
				},
			);

		await (mod as { run: () => Promise<void> }).run();

		expect(globalThis.fetch as typeof fetch).toHaveBeenCalled();
		if (origFetch) globalThis.fetch = origFetch;
		readStub.mockRestore();
	});

	it("throws without GITHUB_TOKEN", async () => {
		const mod = await import("../scripts/create-release");
		await expect(mod.run?.()).rejects.toThrow(/GITHUB_TOKEN required/);
	});

	it("errors when changelog entry missing", async () => {
		process.env.GITHUB_TOKEN = "fake";
		process.env.GITHUB_REPOSITORY = "owner/repo";
		// set tag to a version not in test changelog
		process.env.TAG = "v2.0.0";
		// stub readChangelog to return minimal content
		const stub = vi
			.spyOn(extract, "readChangelog")
			.mockResolvedValue(FIXTURE_CHANGELOG);
		const mod = await import("../scripts/create-release");
		await expect(mod.run()).rejects.toThrow(/Changelog entry not found/);
		stub.mockRestore();
	});
});

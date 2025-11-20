import { describe, expect, it, vi } from "vitest";
import { isVersionPublished } from "../scripts/publish-release";

// Mock execSync for testing
vi.mock("child_process", () => ({
	execSync: vi.fn((cmd: string) => {
		if (cmd.includes("npm view @contentagen/sdk versions")) {
			return JSON.stringify(["0.3.0", "0.6.0"]);
		}
		throw new Error("Unknown command");
	}),
}));

describe("isVersionPublished", () => {
	it("returns true if version is published", async () => {
		expect(await isVersionPublished("@contentagen/sdk", "0.6.0")).toBe(true);
	});

	it("returns false if version is not published", async () => {
		expect(await isVersionPublished("@contentagen/sdk", "1.0.0")).toBe(false);
	});
});

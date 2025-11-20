import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSdk } from "../src";

const originalFetch = globalThis.fetch;

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

const createJsonResponse = (payload: unknown): FetchResponse => {
	return {
		ok: true,
		status: 200,
		statusText: "OK",
		json: async () => payload,
		text: async () => JSON.stringify(payload),
		body: null,
	} as unknown as FetchResponse;
};

const createStreamResponse = (chunks: string[]): FetchResponse => {
	const encoder = new TextEncoder();
	let index = 0;

	const body = {
		getReader() {
			return {
				async read(): Promise<{ done: boolean; value?: Uint8Array }> {
					if (index >= chunks.length) {
						return { done: true };
					}
					const value = encoder.encode(chunks[index] ?? "");
					index += 1;
					return { done: false, value };
				},
				releaseLock() {
					return;
				},
			};
		},
	};

	return {
		ok: true,
		status: 200,
		statusText: "OK",
		json: async () => {
			throw new Error("Not a JSON response");
		},
		text: async () => chunks.join(""),
		body,
	} as unknown as FetchResponse;
};

describe("ContentaGenSDK", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	afterEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	it("serializes array query params as repeated entries", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(createJsonResponse({ posts: [], total: 0 }));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await sdk.listContentByAgent({
			agentId: "agent-123",
			status: ["draft", "approved"],
			limit: 5,
			page: 2,
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const requestUrl = fetchMock.mock.calls[0]?.[0];
		expect(requestUrl).toBeDefined();
		const url = new URL(String(requestUrl));
		expect(url.pathname).toBe("/sdk/content/agent-123");
		expect(url.searchParams.getAll("status")).toEqual(["draft", "approved"]);
		expect(url.searchParams.get("limit")).toBe("5");
		expect(url.searchParams.get("page")).toBe("2");
	});

	it("omits status query param when no statuses are provided", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(createJsonResponse({ posts: [], total: 0 }));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await sdk.listContentByAgent({
			agentId: "agent-456",
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const requestUrl = fetchMock.mock.calls[0]?.[0];
		const url = new URL(String(requestUrl));
		expect(url.pathname).toBe("/sdk/content/agent-456");
		expect(url.searchParams.getAll("status")).toHaveLength(0);
		expect(url.searchParams.get("limit")).toBeNull();
		expect(url.searchParams.get("page")).toBeNull();
	});

	it("prefers per-call locale over default when streaming assistant responses", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(createStreamResponse(["hello", " ", "world"]));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
			locale: "pt-BR",
		});

		const chunks: string[] = [];
		for await (const chunk of sdk.streamAssistantResponse({
			message: "Hello!",
		})) {
			chunks.push(chunk);
		}

		expect(chunks.join("")).toBe("hello world");

		const lastCall = fetchMock.mock.calls[0] as
			| Parameters<typeof fetch>
			| undefined;
		expect(lastCall).toBeDefined();
		const init = (lastCall?.[1] as { headers?: Record<string, string> }) ?? {};
		const headers = init.headers ?? {};
		expect(headers["x-locale"]).toBe("pt-BR");
		expect(headers["sdk-api-key"]).toBe("test-key");
	});
});

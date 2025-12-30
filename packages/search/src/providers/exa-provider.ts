import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import Exa from "exa-js";
import {
	getAvailableKeyCount,
	getNextKey,
	initializeKeys,
	markKeyRateLimited,
	parseApiKeys,
	recordKeyUsage,
} from "../key-rotator";
import type {
	CrawlResult,
	ProviderStatus,
	SearchOptions,
	SearchProvider,
	SearchResult,
} from "../types";

/**
 * Get all Exa API keys
 */
function getExaKeys(): string[] {
	return parseApiKeys(serverEnv.EXA_API_KEYS);
}

class ExaProvider implements SearchProvider {
	readonly id = "exa" as const;
	readonly name = "Exa AI";
	private keys: string[];
	private currentKey: string | null = null;

	constructor() {
		this.keys = getExaKeys();
		initializeKeys(this.id, this.keys);
	}

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const key = getNextKey(this.id, this.keys);
		if (!key) {
			throw AppError.internal("No available Exa API keys");
		}

		this.currentKey = key;

		try {
			const client = new Exa(key);

			const result = await client.searchAndContents(query, {
				numResults: options?.maxResults ?? 10,
				type: "neural",
				text: { maxCharacters: 1000 },
				highlights: true,
			});

			recordKeyUsage(this.id, key);

			return result.results.map((r) => ({
				title: r.title ?? "",
				url: r.url,
				snippet: r.text ?? r.highlights?.join(" ") ?? "",
				score: r.score,
				publishedDate: r.publishedDate,
			}));
		} catch (error) {
			// Check for rate limit errors
			const errorMessage = (error as Error).message?.toLowerCase() ?? "";
			if (
				errorMessage.includes("rate limit") ||
				errorMessage.includes("429") ||
				errorMessage.includes("too many requests") ||
				errorMessage.includes("quota")
			) {
				markKeyRateLimited(this.id, key);

				// Try with another key if available
				const nextKey = getNextKey(this.id, this.keys);
				if (nextKey && nextKey !== key) {
					this.currentKey = nextKey;
					return this.search(query, options);
				}
			}

			propagateError(error);
			throw AppError.internal(`Exa search failed: ${(error as Error).message}`);
		}
	}

	async crawl(url: string): Promise<CrawlResult> {
		const key = getNextKey(this.id, this.keys);
		if (!key) {
			throw AppError.internal("No available Exa API keys");
		}

		this.currentKey = key;

		try {
			const client = new Exa(key);

			// Exa uses getContents for crawling specific URLs
			const result = await client.getContents([url], {
				text: true,
			});

			recordKeyUsage(this.id, key);

			const page = result.results[0];
			if (!page) {
				throw AppError.internal(`No content found for URL: ${url}`);
			}

			return {
				url,
				title: page.title ?? url,
				content: page.text ?? "",
				metadata: {
					author: page.author ?? undefined,
					publishedDate: page.publishedDate ?? undefined,
					wordCount: (page.text ?? "").split(/\s+/).length,
				},
			};
		} catch (error) {
			// Check for rate limit errors
			const errorMessage = (error as Error).message?.toLowerCase() ?? "";
			if (
				errorMessage.includes("rate limit") ||
				errorMessage.includes("429") ||
				errorMessage.includes("too many requests") ||
				errorMessage.includes("quota")
			) {
				markKeyRateLimited(this.id, key);

				// Try with another key if available
				const nextKey = getNextKey(this.id, this.keys);
				if (nextKey && nextKey !== key) {
					this.currentKey = nextKey;
					return this.crawl(url);
				}
			}

			propagateError(error);
			throw AppError.internal(`Exa crawl failed: ${(error as Error).message}`);
		}
	}

	async isAvailable(): Promise<boolean> {
		return this.keys.length > 0 && getAvailableKeyCount(this.id, this.keys) > 0;
	}

	getStatus(): ProviderStatus {
		const availableKeys = getAvailableKeyCount(this.id, this.keys);
		return {
			provider: this.id,
			available: availableKeys > 0,
			availableKeys,
			totalKeys: this.keys.length,
		};
	}

	markKeyRateLimited(key: string): void {
		markKeyRateLimited(this.id, key);
	}

	getCurrentKey(): string | null {
		return this.currentKey;
	}
}

// Export singleton instance
export const exaProvider = new ExaProvider();

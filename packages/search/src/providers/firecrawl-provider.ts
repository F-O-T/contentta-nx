import FirecrawlApp from "@mendable/firecrawl-js";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
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
 * Get all Firecrawl API keys
 */
function getFirecrawlKeys(): string[] {
	return parseApiKeys(serverEnv.FIRECRAWL_API_KEYS);
}

class FirecrawlProvider implements SearchProvider {
	readonly id = "firecrawl" as const;
	readonly name = "Firecrawl";
	private keys: string[];
	private currentKey: string | null = null;

	constructor() {
		this.keys = getFirecrawlKeys();
		initializeKeys(this.id, this.keys);
	}

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const key = getNextKey(this.id, this.keys);
		if (!key) {
			throw AppError.internal("No available Firecrawl API keys");
		}

		this.currentKey = key;

		try {
			const client = new FirecrawlApp({ apiKey: key });

			// Firecrawl uses search endpoint
			const result = await client.search(query, {
				limit: options?.maxResults ?? 10,
			});

			recordKeyUsage(this.id, key);

			// Handle the search result - it returns an array directly
			const searchData = Array.isArray(result) ? result : (result as { data?: unknown[] }).data ?? [];
			
			return searchData.map((item: unknown, index: number) => {
				const r = item as { title?: string; url?: string; description?: string; markdown?: string };
				return {
					title: r.title ?? "",
					url: r.url ?? "",
					snippet: r.description ?? r.markdown?.slice(0, 300) ?? "",
					score: 1 - index * 0.1, // Approximate score based on position
				};
			});
		} catch (error) {
			// Check for rate limit errors
			const errorMessage = (error as Error).message?.toLowerCase() ?? "";
			if (
				errorMessage.includes("rate limit") ||
				errorMessage.includes("429") ||
				errorMessage.includes("too many requests") ||
				errorMessage.includes("quota") ||
				errorMessage.includes("credits")
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
			throw AppError.internal(`Firecrawl search failed: ${(error as Error).message}`);
		}
	}

	async crawl(url: string): Promise<CrawlResult> {
		const key = getNextKey(this.id, this.keys);
		if (!key) {
			throw AppError.internal("No available Firecrawl API keys");
		}

		this.currentKey = key;

		try {
			const client = new FirecrawlApp({ apiKey: key });

			// Firecrawl's scrape is for single page scraping
			const result = await client.scrape(url, {
				formats: ["markdown", "html"],
			});

			recordKeyUsage(this.id, key);

			// Handle the scrape result
			const scrapeData = result as { markdown?: string; html?: string; metadata?: { title?: string; description?: string; author?: string } };

			return {
				url,
				title: scrapeData.metadata?.title ?? url,
				content: scrapeData.markdown ?? "",
				markdown: scrapeData.markdown,
				html: scrapeData.html,
				metadata: {
					description: scrapeData.metadata?.description,
					author: scrapeData.metadata?.author,
					wordCount: (scrapeData.markdown ?? "").split(/\s+/).length,
				},
			};
		} catch (error) {
			// Check for rate limit errors
			const errorMessage = (error as Error).message?.toLowerCase() ?? "";
			if (
				errorMessage.includes("rate limit") ||
				errorMessage.includes("429") ||
				errorMessage.includes("too many requests") ||
				errorMessage.includes("quota") ||
				errorMessage.includes("credits")
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
			throw AppError.internal(`Firecrawl crawl failed: ${(error as Error).message}`);
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
export const firecrawlProvider = new FirecrawlProvider();

import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import { tavily } from "@tavily/core";
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
 * Get all Tavily API keys (from TAVILY_API_KEYS or fallback to TAVILY_API_KEY)
 */
function getTavilyKeys(): string[] {
	// Try multiple keys first
	const multipleKeys = parseApiKeys(serverEnv.TAVILY_API_KEYS);
	if (multipleKeys.length > 0) {
		return multipleKeys;
	}

	// Fallback to single key
	if (serverEnv.TAVILY_API_KEY) {
		return [serverEnv.TAVILY_API_KEY];
	}

	return [];
}

class TavilyProvider implements SearchProvider {
	readonly id = "tavily" as const;
	readonly name = "Tavily";
	private keys: string[];
	private currentKey: string | null = null;

	constructor() {
		this.keys = getTavilyKeys();
		initializeKeys(this.id, this.keys);
	}

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const key = getNextKey(this.id, this.keys);
		if (!key) {
			throw AppError.internal("No available Tavily API keys");
		}

		this.currentKey = key;

		try {
			const client = tavily({ apiKey: key });
			const result = await client.search(query, {
				maxResults: options?.maxResults ?? 10,
				searchDepth: options?.searchDepth ?? "basic",
				includeAnswer: options?.includeAnswer ?? false,
				includeRawContent: options?.includeRawContent ? "markdown" : false,
			});

			recordKeyUsage(this.id, key);

			return result.results.map((r) => ({
				title: r.title,
				url: r.url,
				snippet: r.content,
				score: r.score,
				publishedDate: r.publishedDate,
			}));
		} catch (error) {
			// Check for rate limit errors
			const errorMessage = (error as Error).message?.toLowerCase() ?? "";
			if (
				errorMessage.includes("rate limit") ||
				errorMessage.includes("429") ||
				errorMessage.includes("too many requests")
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
			throw AppError.internal(`Tavily search failed: ${(error as Error).message}`);
		}
	}

	async crawl(url: string): Promise<CrawlResult> {
		const key = getNextKey(this.id, this.keys);
		if (!key) {
			throw AppError.internal("No available Tavily API keys");
		}

		this.currentKey = key;

		try {
			const client = tavily({ apiKey: key });
			const result = await client.extract([url]);

			recordKeyUsage(this.id, key);

			// Get the first extraction result
			const extracted = result.results[0];
			
			if (!extracted) {
				throw AppError.internal("No content extracted from URL");
			}

			return {
				url,
				title: extracted.url,
				content: extracted.rawContent,
				markdown: extracted.rawContent,
				metadata: {
					wordCount: extracted.rawContent.split(/\s+/).length,
				},
			};
		} catch (error) {
			// Check for rate limit errors
			const errorMessage = (error as Error).message?.toLowerCase() ?? "";
			if (
				errorMessage.includes("rate limit") ||
				errorMessage.includes("429") ||
				errorMessage.includes("too many requests")
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
			throw AppError.internal(`Tavily crawl failed: ${(error as Error).message}`);
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
export const tavilyProvider = new TavilyProvider();

import { AppError } from "@packages/utils/errors";
import { exaProvider } from "./providers/exa-provider";
import { firecrawlProvider } from "./providers/firecrawl-provider";
import { tavilyProvider } from "./providers/tavily-provider";
import type {
	CrawlResult,
	ProviderId,
	ProviderStatus,
	SearchOptions,
	SearchProvider,
	SearchResult,
} from "./types";

// Provider priority order (first available is used)
const SEARCH_PROVIDER_ORDER: ProviderId[] = ["tavily", "exa", "firecrawl"];
const CRAWL_PROVIDER_ORDER: ProviderId[] = ["firecrawl", "tavily", "exa"];

// Provider map for quick lookup
const providers: Record<ProviderId, SearchProvider> = {
	tavily: tavilyProvider,
	exa: exaProvider,
	firecrawl: firecrawlProvider,
};

/**
 * Get the first available provider from the priority list
 */
async function getAvailableProvider(
	order: ProviderId[],
): Promise<SearchProvider | null> {
	for (const providerId of order) {
		const provider = providers[providerId];
		if (await provider.isAvailable()) {
			return provider;
		}
	}
	return null;
}

/**
 * Search with automatic provider fallback
 */
export async function search(
	query: string,
	options?: SearchOptions & { preferredProvider?: ProviderId },
): Promise<{ results: SearchResult[]; provider: ProviderId }> {
	const preferredProvider = options?.preferredProvider;
	
	// Ensure defaults for required fields
	const searchOptions: SearchOptions = {
		maxResults: options?.maxResults ?? 10,
		searchDepth: options?.searchDepth ?? "basic",
		includeAnswer: options?.includeAnswer ?? false,
		includeRawContent: options?.includeRawContent ?? false,
		timeRange: options?.timeRange,
		domain: options?.domain,
	};

	// Build provider order with preferred provider first
	let order = [...SEARCH_PROVIDER_ORDER];
	if (preferredProvider) {
		order = [preferredProvider, ...order.filter((p) => p !== preferredProvider)];
	}

	// Try each provider in order
	for (const providerId of order) {
		const provider = providers[providerId];

		if (!(await provider.isAvailable())) {
			continue;
		}

		try {
			const results = await provider.search(query, searchOptions);
			return { results, provider: providerId };
		} catch (error) {
			// Log and continue to next provider
			console.warn(
				`Search provider ${providerId} failed, trying next:`,
				(error as Error).message,
			);
			continue;
		}
	}

	throw AppError.internal(
		"All search providers exhausted. Please try again later.",
	);
}

/**
 * Crawl with automatic provider fallback
 */
export async function crawl(
	url: string,
	options?: { preferredProvider?: ProviderId },
): Promise<{ result: CrawlResult; provider: ProviderId }> {
	const { preferredProvider } = options ?? {};

	// Build provider order with preferred provider first
	let order = [...CRAWL_PROVIDER_ORDER];
	if (preferredProvider) {
		order = [preferredProvider, ...order.filter((p) => p !== preferredProvider)];
	}

	// Try each provider in order
	for (const providerId of order) {
		const provider = providers[providerId];

		if (!(await provider.isAvailable())) {
			continue;
		}

		try {
			const result = await provider.crawl(url);
			return { result, provider: providerId };
		} catch (error) {
			// Log and continue to next provider
			console.warn(
				`Crawl provider ${providerId} failed, trying next:`,
				(error as Error).message,
			);
			continue;
		}
	}

	throw AppError.internal(
		"All crawl providers exhausted. Please try again later.",
	);
}

/**
 * Get status of all providers
 */
export function getAllProviderStatus(): ProviderStatus[] {
	return Object.values(providers).map((p) => p.getStatus());
}

/**
 * Get a specific provider by ID
 */
export function getProvider(id: ProviderId): SearchProvider {
	return providers[id];
}

/**
 * Check if any provider is available for search
 */
export async function isSearchAvailable(): Promise<boolean> {
	const provider = await getAvailableProvider(SEARCH_PROVIDER_ORDER);
	return provider !== null;
}

/**
 * Check if any provider is available for crawling
 */
export async function isCrawlAvailable(): Promise<boolean> {
	const provider = await getAvailableProvider(CRAWL_PROVIDER_ORDER);
	return provider !== null;
}

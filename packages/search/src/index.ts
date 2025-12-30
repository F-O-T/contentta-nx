// Types
export type {
	CompetitorContent,
	CrawlResult,
	KeyUsage,
	ProviderId,
	ProviderStatus,
	SearchOptions,
	SearchProvider,
	SearchResult,
	SerpAnalysis,
} from "./types";

export {
	CompetitorContentSchema,
	CrawlResultSchema,
	SearchOptionsSchema,
	SearchResultSchema,
	SerpAnalysisSchema,
} from "./types";

// Key rotation
export {
	clearAllRateLimits,
	getAvailableKeyCount,
	getKeyStats,
	getNextKey,
	initializeKeys,
	markKeyRateLimited,
	parseApiKeys,
	recordKeyUsage,
	resetAllUsage,
} from "./key-rotator";

// Providers
export { exaProvider } from "./providers/exa-provider";
export { firecrawlProvider } from "./providers/firecrawl-provider";
export { tavilyProvider } from "./providers/tavily-provider";

// Unified search interface
export {
	crawl,
	getAllProviderStatus,
	getProvider,
	isCrawlAvailable,
	isSearchAvailable,
	search,
} from "./provider-selector";

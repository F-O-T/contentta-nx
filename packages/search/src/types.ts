import { z } from "zod";

// Search result from any provider
export const SearchResultSchema = z.object({
	title: z.string(),
	url: z.string().url(),
	snippet: z.string(),
	score: z.number().optional(),
	publishedDate: z.string().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// Crawl result from any provider
export const CrawlResultSchema = z.object({
	url: z.string().url(),
	title: z.string(),
	content: z.string(),
	markdown: z.string().optional(),
	html: z.string().optional(),
	metadata: z
		.object({
			description: z.string().optional(),
			author: z.string().optional(),
			publishedDate: z.string().optional(),
			wordCount: z.number().optional(),
		})
		.optional(),
});

export type CrawlResult = z.infer<typeof CrawlResultSchema>;

// Search options
export const SearchOptionsSchema = z.object({
	maxResults: z.number().min(1).max(20).default(10),
	searchDepth: z.enum(["basic", "advanced"]).default("basic"),
	includeAnswer: z.boolean().default(false),
	includeRawContent: z.boolean().default(false),
	timeRange: z.enum(["day", "week", "month", "year", "all"]).optional(),
	domain: z.string().optional(),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

// Provider identifiers
export type ProviderId = "tavily" | "exa" | "firecrawl";

// Key usage tracking
export interface KeyUsage {
	key: string;
	provider: ProviderId;
	requestsToday: number;
	lastUsed: Date;
	rateLimited: boolean;
	resetAt?: Date;
}

// Provider availability status
export interface ProviderStatus {
	provider: ProviderId;
	available: boolean;
	availableKeys: number;
	totalKeys: number;
	lastError?: string;
}

// Unified search interface
export interface SearchProvider {
	id: ProviderId;
	name: string;

	// Core operations
	search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
	crawl(url: string): Promise<CrawlResult>;

	// Availability
	isAvailable(): Promise<boolean>;
	getStatus(): ProviderStatus;

	// Key management
	markKeyRateLimited(key: string): void;
	getCurrentKey(): string | null;
}

// SERP analysis result
export const SerpAnalysisSchema = z.object({
	query: z.string(),
	topResults: z.array(
		z.object({
			title: z.string(),
			url: z.string().url(),
			snippet: z.string(),
			position: z.number(),
		}),
	),
	featuredSnippet: z.string().optional(),
	peopleAlsoAsk: z.array(z.string()).optional(),
	relatedSearches: z.array(z.string()).optional(),
	avgWordCount: z.number().optional(),
	commonHeadings: z.array(z.string()).optional(),
	keywordUsage: z.record(z.string(), z.number()).optional(),
});

export type SerpAnalysis = z.infer<typeof SerpAnalysisSchema>;

// Competitor content analysis
export const CompetitorContentSchema = z.object({
	url: z.string().url(),
	title: z.string(),
	wordCount: z.number(),
	headings: z.array(
		z.object({
			level: z.number(),
			text: z.string(),
		}),
	),
	keywords: z.array(z.string()),
	readabilityScore: z.number().optional(),
	structure: z.object({
		paragraphs: z.number(),
		lists: z.number(),
		images: z.number(),
		codeBlocks: z.number(),
	}),
});

export type CompetitorContent = z.infer<typeof CompetitorContentSchema>;

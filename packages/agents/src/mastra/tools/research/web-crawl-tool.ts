import { createTool } from "@mastra/core/tools";
import { crawl, type ProviderId } from "@packages/search";
import { AppError } from "@packages/utils/errors";
import { z } from "zod";

export const webCrawlTool = createTool({
	id: "web-crawl",
	description:
		"Crawls a webpage to extract its full content. Useful for getting detailed information from a specific URL.",
	inputSchema: z.object({
		url: z.string().url().describe("The URL to crawl"),
		preferredProvider: z
			.enum(["tavily", "exa", "firecrawl"])
			.optional()
			.describe("Preferred provider (will fallback to others if unavailable)"),
	}),
	outputSchema: z.object({
		url: z.string(),
		title: z.string(),
		content: z.string(),
		markdown: z.string().optional(),
		metadata: z
			.object({
				description: z.string().optional(),
				author: z.string().optional(),
				publishedDate: z.string().optional(),
				wordCount: z.number().optional(),
			})
			.optional(),
		provider: z.string(),
	}),
	execute: async (inputData) => {
		const { url, preferredProvider } = inputData;

		try {
			const { result, provider } = await crawl(url, {
				preferredProvider: preferredProvider as ProviderId | undefined,
			});

			return {
				url: result.url,
				title: result.title,
				content: result.content,
				markdown: result.markdown,
				metadata: result.metadata,
				provider,
			};
		} catch (error) {
			throw AppError.internal(`Web crawl failed: ${(error as Error).message}`);
		}
	},
});

export function getWebCrawlInstructions(): string {
	return `
## WEB CRAWL TOOL
Extracts full content from a specific webpage.

**When to use:** Get detailed content from a URL found via search

**Parameters:**
- url (string): Full URL to crawl (https://...)
- preferredProvider (enum, optional): "tavily", "exa", or "firecrawl"

**Returns:**
- url: The crawled URL
- title: Page title
- content: Full text content
- markdown: Content as markdown (if available)
- metadata: Description, author, date, word count
- provider: Which provider was used

**Tips:**
- Use after webSearch to get full content
- Great for extracting quotes, statistics, or detailed information
`;
}

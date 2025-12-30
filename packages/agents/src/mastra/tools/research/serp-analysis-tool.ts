import { createTool } from "@mastra/core/tools";
import { crawl, search } from "@packages/search";
import { AppError } from "@packages/utils/errors";
import { z } from "zod";

export const serpAnalysisTool = createTool({
	id: "serp-analysis",
	description:
		"Analyzes SERP (Search Engine Results Page) for a keyword to understand what's ranking and how to compete.",
	inputSchema: z.object({
		query: z
			.string()
			.describe("The keyword or query to analyze"),
		analyzeTopResults: z
			.number()
			.min(1)
			.max(10)
			.optional()
			.default(5)
			.describe("Number of top results to analyze in detail"),
	}),
	outputSchema: z.object({
		query: z.string(),
		topResults: z.array(
			z.object({
				position: z.number(),
				title: z.string(),
				url: z.string(),
				snippet: z.string(),
				titleLength: z.number(),
				snippetLength: z.number(),
			})
		),
		commonPatterns: z.object({
			avgTitleLength: z.number(),
			avgSnippetLength: z.number(),
			commonTitleWords: z.array(z.string()),
			commonSnippetWords: z.array(z.string()),
			titleFormats: z.array(z.string()),
		}),
		contentAnalysis: z.array(
			z.object({
				url: z.string(),
				wordCount: z.number(),
				headings: z.array(z.string()),
				keyTopics: z.array(z.string()),
			})
		).optional(),
		recommendations: z.array(z.string()),
	}),
	execute: async (inputData) => {
		const { query, analyzeTopResults } = inputData;

		try {
			// Search for the query
			const { results } = await search(query, {
				maxResults: 10,
				searchDepth: "basic",
				includeAnswer: false,
				includeRawContent: false,
			});

			// Analyze top results
			const topResults = results.slice(0, 10).map((r, index) => ({
				position: index + 1,
				title: r.title,
				url: r.url,
				snippet: r.snippet,
				titleLength: r.title.length,
				snippetLength: r.snippet.length,
			}));

			// Extract common patterns
			const titles = topResults.map((r) => r.title);
			const snippets = topResults.map((r) => r.snippet);

			// Stop words to filter
			const stopWords = new Set([
				"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
				"of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
				"have", "has", "had", "do", "does", "did", "will", "would", "could",
				"should", "may", "might", "must", "that", "this", "it", "you", "your",
				"we", "our", "they", "their", "what", "how", "why", "when", "where",
			]);

			// Extract common words from titles
			const titleWords: Record<string, number> = {};
			for (const title of titles) {
				const words = title.toLowerCase().split(/\s+/).filter(Boolean);
				for (const word of words) {
					if (word.length > 3 && !stopWords.has(word)) {
						titleWords[word] = (titleWords[word] || 0) + 1;
					}
				}
			}

			// Extract common words from snippets
			const snippetWords: Record<string, number> = {};
			for (const snippet of snippets) {
				const words = snippet.toLowerCase().split(/\s+/).filter(Boolean);
				for (const word of words) {
					if (word.length > 3 && !stopWords.has(word)) {
						snippetWords[word] = (snippetWords[word] || 0) + 1;
					}
				}
			}

			// Identify title formats/patterns
			const titleFormats: string[] = [];
			if (titles.some((t) => t.includes(":"))) {
				titleFormats.push("Uses colon separator");
			}
			if (titles.some((t) => /^\d+/.test(t))) {
				titleFormats.push("Starts with number (listicle style)");
			}
			if (titles.some((t) => t.includes("How to"))) {
				titleFormats.push("How-to format");
			}
			if (titles.some((t) => /\?$/.test(t))) {
				titleFormats.push("Question format");
			}
			if (titles.some((t) => t.includes("|") || t.includes("-"))) {
				titleFormats.push("Brand separator");
			}
			if (titles.some((t) => /\d{4}/.test(t))) {
				titleFormats.push("Includes year");
			}

			// Analyze content of top results (optional, limited to avoid rate limits)
			const contentAnalysis: Array<{
				url: string;
				wordCount: number;
				headings: string[];
				keyTopics: string[];
			}> = [];

			// Only crawl top 3 to be conservative with API usage
			const toCrawl = topResults.slice(0, Math.min(analyzeTopResults, 3));
			for (const result of toCrawl) {
				try {
					const { result: crawlResult } = await crawl(result.url);
					const content = crawlResult.content;

					// Extract headings
					const headings = content.match(/^#{1,3}\s+(.+)$/gm) || [];
					const cleanHeadings = headings
						.map((h) => h.replace(/^#+\s+/, ""))
						.slice(0, 10);

					// Extract key topics (most frequent meaningful words)
					const words = content.toLowerCase().split(/\s+/).filter(Boolean);
					const wordFreq: Record<string, number> = {};
					for (const word of words) {
						if (word.length > 4 && !stopWords.has(word)) {
							wordFreq[word] = (wordFreq[word] || 0) + 1;
						}
					}
					const keyTopics = Object.entries(wordFreq)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map(([word]) => word);

					contentAnalysis.push({
						url: result.url,
						wordCount: crawlResult.metadata?.wordCount || words.length,
						headings: cleanHeadings,
						keyTopics,
					});
				} catch {
					// Skip failed crawls
					continue;
				}
			}

			// Generate recommendations
			const recommendations: string[] = [];
			const avgTitleLength = Math.round(
				topResults.reduce((sum, r) => sum + r.titleLength, 0) / topResults.length
			);
			const avgSnippetLength = Math.round(
				topResults.reduce((sum, r) => sum + r.snippetLength, 0) / topResults.length
			);

			recommendations.push(`Aim for title length around ${avgTitleLength} characters`);
			recommendations.push(`Meta description should be around ${avgSnippetLength} characters`);

			if (titleFormats.includes("Uses colon separator")) {
				recommendations.push("Consider using a colon in your title (e.g., 'Topic: Specific Focus')");
			}

			if (titleFormats.includes("Includes year")) {
				recommendations.push("Consider including the current year for freshness");
			}

			const commonTitleWordsList = Object.entries(titleWords)
				.filter(([, count]) => count >= 2)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([word]) => word);

			if (commonTitleWordsList.length > 0) {
				recommendations.push(`Common title keywords: ${commonTitleWordsList.join(", ")}`);
			}

			if (contentAnalysis.length > 0) {
				const avgWordCount = Math.round(
					contentAnalysis.reduce((sum, c) => sum + c.wordCount, 0) / contentAnalysis.length
				);
				recommendations.push(`Top-ranking content averages ${avgWordCount} words`);
			}

			return {
				query,
				topResults,
				commonPatterns: {
					avgTitleLength,
					avgSnippetLength,
					commonTitleWords: Object.entries(titleWords)
						.filter(([, count]) => count >= 2)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map(([word]) => word),
					commonSnippetWords: Object.entries(snippetWords)
						.filter(([, count]) => count >= 3)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map(([word]) => word),
					titleFormats,
				},
				contentAnalysis: contentAnalysis.length > 0 ? contentAnalysis : undefined,
				recommendations,
			};
		} catch (error) {
			throw AppError.internal(`SERP analysis failed: ${(error as Error).message}`);
		}
	},
});

export function getSerpAnalysisInstructions(): string {
	return `
## SERP ANALYSIS TOOL
Analyzes search results to understand ranking patterns and competition.

**When to use:** Before writing to understand what content ranks well

**Parameters:**
- query (string): The keyword to analyze
- analyzeTopResults (number): How many results to crawl for detailed analysis (1-10)

**Returns:**
- topResults: Top 10 search results with position, title, URL, snippet
- commonPatterns: Avg title/snippet length, common words, title formats
- contentAnalysis: Word count, headings, key topics from top pages
- recommendations: Actionable SEO suggestions

**Tips:**
- Run this before starting your blog post
- Use recommendations to structure your content
- Match or exceed the word count of top results
`;
}

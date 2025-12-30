import { createTool } from "@mastra/core/tools";
import { crawl } from "@packages/search";
import { AppError } from "@packages/utils/errors";
import { z } from "zod";

export const competitorContentTool = createTool({
	id: "competitor-content",
	description:
		"Analyzes a competitor's blog post to understand their content structure, topics, and what makes it rank well.",
	inputSchema: z.object({
		url: z.string().url().describe("URL of the competitor's blog post to analyze"),
	}),
	outputSchema: z.object({
		url: z.string(),
		title: z.string(),
		wordCount: z.number(),
		readingTime: z.number(),
		structure: z.object({
			headings: z.array(
				z.object({
					level: z.number(),
					text: z.string(),
				})
			),
			paragraphCount: z.number(),
			listCount: z.number(),
			imageCount: z.number(),
			codeBlockCount: z.number(),
			linkCount: z.number(),
		}),
		content: z.object({
			introduction: z.string(),
			keyPoints: z.array(z.string()),
			conclusion: z.string().optional(),
		}),
		seo: z.object({
			titleLength: z.number(),
			hasNumbers: z.boolean(),
			hasPowerWords: z.array(z.string()),
			keywordOpportunities: z.array(z.string()),
		}),
		improvements: z.array(z.string()),
	}),
	execute: async (inputData) => {
		const { url } = inputData;

		try {
			const { result } = await crawl(url);
			const content = result.content;
			const markdown = result.markdown || content;

			// Extract structure
			const headingMatches = markdown.match(/^(#{1,6})\s+(.+)$/gm) || [];
			const headings = headingMatches.map((h: string) => {
				const match = h.match(/^(#+)\s+(.+)$/);
				return {
					level: match?.[1]?.length ?? 1,
					text: match?.[2] ?? h,
				};
			});

			const paragraphs = markdown.split(/\n\n+/).filter((p: string) =>
				p.trim().length > 0 && !p.startsWith("#") && !p.startsWith("-") && !p.startsWith("*")
			);
			const lists = markdown.match(/^[-*]\s.+$/gm) || [];
			const images = markdown.match(/!\[.+?\]\(.+?\)/g) || [];
			const codeBlocks = markdown.match(/```[\s\S]*?```/g) || [];
			const links = markdown.match(/\[.+?\]\(.+?\)/g) || [];

			// Word count and reading time
			const words = content.split(/\s+/).filter(Boolean);
			const wordCount = words.length;
			const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

			// Extract key content
			const firstParagraph = paragraphs[0];
			const introduction = firstParagraph
				? firstParagraph.slice(0, 500)
				: "";

			// Extract key points from headings and their first paragraphs
			const keyPoints: string[] = [];
			for (const heading of headings.slice(0, 10)) {
				if (heading.level >= 2 && heading.level <= 3) {
					keyPoints.push(heading.text);
				}
			}

			// Get conclusion (last paragraph or section)
			const lastParagraph = paragraphs[paragraphs.length - 1];
			const conclusion = paragraphs.length > 2 && lastParagraph
				? lastParagraph.slice(0, 300)
				: undefined;

			// SEO analysis
			const title = result.title;
			const hasNumbers = /\d/.test(title);

			// Power words detection
			const powerWords = [
				"ultimate", "complete", "essential", "best", "proven", "powerful",
				"secret", "amazing", "incredible", "exclusive", "free", "new",
				"easy", "simple", "fast", "quick", "instant", "guaranteed",
				"step-by-step", "comprehensive", "definitive", "expert",
			];
			const titleLower = title.toLowerCase();
			const hasPowerWords = powerWords.filter((w) => titleLower.includes(w));

			// Find frequent meaningful words as keyword opportunities
			const stopWords = new Set([
				"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
				"of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
				"have", "has", "had", "do", "does", "did", "will", "would", "could",
				"should", "may", "might", "must", "that", "this", "it", "you", "your",
			]);

			const wordFreq: Record<string, number> = {};
			for (const word of words) {
				const w = word.toLowerCase().replace(/[^\w]/g, "");
				if (w.length > 4 && !stopWords.has(w)) {
					wordFreq[w] = (wordFreq[w] || 0) + 1;
				}
			}

			const keywordOpportunities = Object.entries(wordFreq)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 15)
				.map(([word]) => word);

			// Generate improvement suggestions
			const improvements: string[] = [];

			if (wordCount < 1500) {
				improvements.push(`Content is ${wordCount} words. Consider creating longer content (1500-2500 words) to compete.`);
			} else {
				improvements.push(`Match or exceed the ${wordCount} word count.`);
			}

			if (headings.length < 5) {
				improvements.push("Add more subheadings to improve scannability.");
			} else {
				improvements.push(`Include at least ${headings.length} subheadings for structure.`);
			}

			if (lists.length > 0) {
				improvements.push(`Use lists like the competitor (they have ${lists.length} list items).`);
			}

			if (images.length > 0) {
				improvements.push(`Include ${images.length}+ images with descriptive alt text.`);
			} else {
				improvements.push("Consider adding images - competitor has none, this is an opportunity.");
			}

			if (codeBlocks.length > 0) {
				improvements.push(`Include code examples (competitor has ${codeBlocks.length}).`);
			}

			if (!hasNumbers) {
				improvements.push("Consider using numbers in your title (e.g., '10 Ways to...').");
			}

			if (hasPowerWords.length === 0) {
				improvements.push("Add power words to your title (e.g., 'Ultimate', 'Complete', 'Essential').");
			}

			return {
				url,
				title,
				wordCount,
				readingTime,
				structure: {
					headings,
					paragraphCount: paragraphs.length,
					listCount: lists.length,
					imageCount: images.length,
					codeBlockCount: codeBlocks.length,
					linkCount: links.length,
				},
				content: {
					introduction,
					keyPoints,
					conclusion,
				},
				seo: {
					titleLength: title.length,
					hasNumbers,
					hasPowerWords,
					keywordOpportunities,
				},
				improvements,
			};
		} catch (error) {
			throw AppError.internal(`Competitor analysis failed: ${(error as Error).message}`);
		}
	},
});

export function getCompetitorContentInstructions(): string {
	return `
## COMPETITOR CONTENT TOOL
Analyzes a specific competitor blog post to understand what makes it rank.

**When to use:** To understand a specific competing article's structure and strategy

**Parameters:**
- url (string): Full URL of the competitor's blog post

**Returns:**
- wordCount/readingTime: Content length metrics
- structure: Headings, paragraphs, lists, images, code blocks, links
- content: Introduction, key points, conclusion
- seo: Title analysis, power words, keyword opportunities
- improvements: Specific suggestions to outrank the competitor

**Tips:**
- Use after serpAnalysis to deep-dive into top results
- Focus on matching or exceeding their structure
- Look for gaps you can fill with better content
`;
}

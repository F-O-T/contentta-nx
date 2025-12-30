import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const KeywordAnalysisSchema = z.object({
	keyword: z.string(),
	count: z.number(),
	density: z.number(),
	locations: z.array(
		z.object({
			type: z.enum(["title", "heading", "paragraph", "first100words", "last100words"]),
			index: z.number().optional(),
		})
	),
	status: z.enum(["optimal", "low", "high", "missing"]),
	suggestion: z.string().optional(),
});

export const keywordDensityTool = createTool({
	id: "keyword-density",
	description:
		"Analyzes keyword usage and density in the blog post. Checks for optimal keyword placement and frequency for SEO.",
	inputSchema: z.object({
		content: z.string().describe("The blog post content to analyze"),
		title: z.string().optional().describe("The blog post title"),
		targetKeywords: z
			.array(z.string())
			.min(1)
			.describe("Keywords to analyze"),
	}),
	outputSchema: z.object({
		analysis: z.array(KeywordAnalysisSchema),
		overallScore: z.number().min(0).max(100),
		topKeywords: z.array(
			z.object({
				keyword: z.string(),
				count: z.number(),
				density: z.number(),
			})
		),
		recommendations: z.array(z.string()),
		metrics: z.object({
			totalWordCount: z.number(),
			uniqueWordCount: z.number(),
			avgKeywordDensity: z.number(),
		}),
	}),
	execute: async (inputData) => {
		const { content, title, targetKeywords } = inputData;

		// Basic text analysis
		const words = content.toLowerCase().split(/\s+/).filter(Boolean);
		const totalWordCount = words.length;
		const uniqueWords = new Set(words);

		// Extract headings from markdown
		const headingMatches = content.match(/^#{1,6}\s+(.+)$/gm) || [];
		const headings = headingMatches.map((h: string) => h.replace(/^#+\s+/, "").toLowerCase());

		// Split into paragraphs
		const paragraphs = content.split(/\n\n+/).filter(Boolean);

		// Get first and last 100 words
		const first100Words = words.slice(0, 100).join(" ");
		const last100Words = words.slice(-100).join(" ");

		// Analyze each target keyword
		const analysis: z.infer<typeof KeywordAnalysisSchema>[] = [];
		let totalScore = 0;

		for (const keyword of targetKeywords) {
			const keywordLower = keyword.toLowerCase();
			const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");

			// Count occurrences
			const matches = content.toLowerCase().match(regex) || [];
			const count = matches.length;
			const density = Number(((count / totalWordCount) * 100).toFixed(2));

			// Find locations
			const locations: z.infer<typeof KeywordAnalysisSchema>["locations"] = [];

			if (title && title.toLowerCase().includes(keywordLower)) {
				locations.push({ type: "title" });
			}

			headings.forEach((heading: string, index: number) => {
				if (heading.includes(keywordLower)) {
					locations.push({ type: "heading", index });
				}
			});

			paragraphs.forEach((para: string, index: number) => {
				if (para.toLowerCase().includes(keywordLower)) {
					locations.push({ type: "paragraph", index });
				}
			});

			if (first100Words.includes(keywordLower)) {
				locations.push({ type: "first100words" });
			}

			if (last100Words.includes(keywordLower)) {
				locations.push({ type: "last100words" });
			}

			// Determine status and suggestion
			let status: z.infer<typeof KeywordAnalysisSchema>["status"];
			let suggestion: string | undefined;
			let keywordScore = 0;

			if (count === 0) {
				status = "missing";
				suggestion = `Add "${keyword}" to your content, especially in headings and the first paragraph`;
				keywordScore = 0;
			} else if (density < 0.5) {
				status = "low";
				suggestion = `Increase usage of "${keyword}" - aim for 1-2% density`;
				keywordScore = 40;
			} else if (density > 3) {
				status = "high";
				suggestion = `Reduce usage of "${keyword}" - currently ${density}%, aim for 1-2%`;
				keywordScore = 60;
			} else {
				status = "optimal";
				keywordScore = 100;

				// Bonus for good placement
				if (!locations.some((l) => l.type === "title")) {
					suggestion = `Consider adding "${keyword}" to the title for better SEO`;
					keywordScore -= 10;
				}
				if (!locations.some((l) => l.type === "first100words")) {
					suggestion = `Add "${keyword}" in the first paragraph for better SEO`;
					keywordScore -= 10;
				}
			}

			totalScore += keywordScore;

			analysis.push({
				keyword,
				count,
				density,
				locations,
				status,
				suggestion,
			});
		}

		// Find top keywords in content (excluding common words)
		const stopWords = new Set([
			"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
			"of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
			"be", "have", "has", "had", "do", "does", "did", "will", "would",
			"could", "should", "may", "might", "must", "that", "this", "these",
			"those", "it", "its", "you", "your", "we", "our", "they", "their",
		]);

		const wordFrequency: Record<string, number> = {};
		for (const word of words) {
			if (word.length > 3 && !stopWords.has(word)) {
				wordFrequency[word] = (wordFrequency[word] || 0) + 1;
			}
		}

		const topKeywords = Object.entries(wordFrequency)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([keyword, count]) => ({
				keyword,
				count,
				density: Number(((count / totalWordCount) * 100).toFixed(2)),
			}));

		// Generate recommendations
		const recommendations: string[] = [];
		const missingKeywords = analysis.filter((a) => a.status === "missing");
		const lowKeywords = analysis.filter((a) => a.status === "low");
		const highKeywords = analysis.filter((a) => a.status === "high");

		if (missingKeywords.length > 0) {
			recommendations.push(
				`Add missing keywords: ${missingKeywords.map((k) => k.keyword).join(", ")}`
			);
		}

		if (lowKeywords.length > 0) {
			recommendations.push(
				`Increase usage of: ${lowKeywords.map((k) => k.keyword).join(", ")}`
			);
		}

		if (highKeywords.length > 0) {
			recommendations.push(
				`Reduce keyword stuffing for: ${highKeywords.map((k) => k.keyword).join(", ")}`
			);
		}

		// Check for keyword in title
		const keywordsNotInTitle = analysis.filter(
			(a) => a.status !== "missing" && !a.locations.some((l) => l.type === "title")
		);
		if (keywordsNotInTitle.length > 0 && title && keywordsNotInTitle[0]) {
			recommendations.push(
				`Consider adding primary keyword to title: ${keywordsNotInTitle[0].keyword}`
			);
		}

		return {
			analysis,
			overallScore: Math.round(totalScore / targetKeywords.length),
			topKeywords,
			recommendations,
			metrics: {
				totalWordCount,
				uniqueWordCount: uniqueWords.size,
				avgKeywordDensity: Number(
					(
						analysis.reduce((sum, a) => sum + a.density, 0) / analysis.length
					).toFixed(2)
				),
			},
		};
	},
});

export function getKeywordDensityInstructions(): string {
	return `
## KEYWORD DENSITY TOOL
Analyzes keyword usage, placement, and density in the blog post.

**When to use:** To optimize content for target keywords and SEO

**Parameters:**
- content (string): The blog post content
- title (string, optional): Blog post title
- targetKeywords (string[]): Keywords to analyze

**Returns:**
- analysis: Per-keyword breakdown with count, density, locations, status
- overallScore: 0-100 keyword optimization score
- topKeywords: Most frequent words in content
- recommendations: Suggestions for improvement
- metrics: Word counts and average density

**Optimal density:** 1-2% for each target keyword
**Key placements:** Title, first paragraph, headings
`;
}

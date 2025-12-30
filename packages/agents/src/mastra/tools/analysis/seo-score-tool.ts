import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const SeoIssueSchema = z.object({
	type: z.enum([
		"title",
		"meta_description",
		"headings",
		"keyword_density",
		"content_length",
		"readability",
		"links",
		"images",
	]),
	severity: z.enum(["error", "warning", "info"]),
	message: z.string(),
	suggestion: z.string(),
});

export const seoScoreTool = createTool({
	id: "seo-score",
	description:
		"Analyzes the blog post for SEO best practices and returns a score with specific recommendations.",
	inputSchema: z.object({
		content: z.string().describe("The blog post content to analyze"),
		title: z.string().optional().describe("The blog post title"),
		metaDescription: z.string().optional().describe("The meta description"),
		targetKeywords: z
			.array(z.string())
			.optional()
			.describe("Target keywords to check for"),
		focusArea: z
			.enum(["title", "headings", "body", "meta", "all"])
			.default("all")
			.describe("Which area to focus the analysis on"),
	}),
	outputSchema: z.object({
		score: z.number().min(0).max(100),
		issues: z.array(SeoIssueSchema),
		recommendations: z.array(z.string()),
		metrics: z.object({
			wordCount: z.number(),
			headingCount: z.number(),
			paragraphCount: z.number(),
			linkCount: z.number(),
			imageCount: z.number(),
			keywordDensity: z.record(z.string(), z.number()).optional(),
		}),
	}),
	execute: async (inputData) => {
		const { content, title, metaDescription, targetKeywords, focusArea } = inputData;

		const issues: z.infer<typeof SeoIssueSchema>[] = [];
		const recommendations: string[] = [];

		// Basic content analysis
		const wordCount = content.split(/\s+/).filter(Boolean).length;
		const paragraphs = content.split(/\n\n+/).filter(Boolean);
		const headings = content.match(/^#{1,6}\s.+$/gm) || [];
		const links = content.match(/\[.+?\]\(.+?\)/g) || [];
		const images = content.match(/!\[.+?\]\(.+?\)/g) || [];

		let score = 100;

		// Title checks
		if (focusArea === "all" || focusArea === "title") {
			if (!title) {
				issues.push({
					type: "title",
					severity: "error",
					message: "Missing title",
					suggestion: "Add a descriptive title (50-60 characters)",
				});
				score -= 15;
			} else if (title.length < 30) {
				issues.push({
					type: "title",
					severity: "warning",
					message: "Title is too short",
					suggestion: "Expand title to 50-60 characters for better SEO",
				});
				score -= 5;
			} else if (title.length > 60) {
				issues.push({
					type: "title",
					severity: "warning",
					message: "Title is too long",
					suggestion: "Shorten to under 60 characters to avoid truncation in search results",
				});
				score -= 5;
			}
		}

		// Meta description checks
		if (focusArea === "all" || focusArea === "meta") {
			if (!metaDescription) {
				issues.push({
					type: "meta_description",
					severity: "warning",
					message: "Missing meta description",
					suggestion: "Add a meta description (150-160 characters)",
				});
				score -= 10;
			} else if (metaDescription.length < 120) {
				issues.push({
					type: "meta_description",
					severity: "info",
					message: "Meta description could be longer",
					suggestion: "Expand to 150-160 characters",
				});
				score -= 3;
			} else if (metaDescription.length > 160) {
				issues.push({
					type: "meta_description",
					severity: "warning",
					message: "Meta description is too long",
					suggestion: "Shorten to under 160 characters",
				});
				score -= 5;
			}
		}

		// Headings checks
		if (focusArea === "all" || focusArea === "headings") {
			if (headings.length === 0) {
				issues.push({
					type: "headings",
					severity: "error",
					message: "No headings found",
					suggestion: "Add H2 and H3 headings to structure your content",
				});
				score -= 15;
			} else if (headings.length < 3 && wordCount > 500) {
				issues.push({
					type: "headings",
					severity: "warning",
					message: "Too few headings for content length",
					suggestion: "Add more subheadings (one every 200-300 words)",
				});
				score -= 5;
			}
		}

		// Content length checks
		if (focusArea === "all" || focusArea === "body") {
			if (wordCount < 300) {
				issues.push({
					type: "content_length",
					severity: "error",
					message: "Content is too short",
					suggestion: "Aim for at least 600-1000 words for blog posts",
				});
				score -= 20;
			} else if (wordCount < 600) {
				issues.push({
					type: "content_length",
					severity: "warning",
					message: "Content could be longer",
					suggestion: "Consider expanding to 1000+ words for better ranking",
				});
				score -= 10;
			}

			// Link checks
			if (links.length === 0 && wordCount > 500) {
				issues.push({
					type: "links",
					severity: "warning",
					message: "No links found",
					suggestion: "Add internal and external links to improve SEO",
				});
				score -= 5;
			}

			// Image checks
			if (images.length === 0 && wordCount > 300) {
				issues.push({
					type: "images",
					severity: "info",
					message: "No images found",
					suggestion: "Add images with descriptive alt text",
				});
				score -= 3;
			}
		}

		// Keyword density
		const keywordDensity: Record<string, number> = {};
		if (targetKeywords && targetKeywords.length > 0) {
			const contentLower = content.toLowerCase();
			for (const keyword of targetKeywords) {
				const regex = new RegExp(keyword.toLowerCase(), "gi");
				const matches = contentLower.match(regex) || [];
				keywordDensity[keyword] = Number(
					((matches.length / wordCount) * 100).toFixed(2)
				);

				if (keywordDensity[keyword] === 0) {
					issues.push({
						type: "keyword_density",
						severity: "warning",
						message: `Target keyword "${keyword}" not found`,
						suggestion: `Include "${keyword}" naturally in your content`,
					});
					score -= 5;
				} else if (keywordDensity[keyword] > 3) {
					issues.push({
						type: "keyword_density",
						severity: "warning",
						message: `Keyword "${keyword}" may be overused (${keywordDensity[keyword]}%)`,
						suggestion: "Reduce keyword density to 1-2%",
					});
					score -= 3;
				}
			}
		}

		// Generate recommendations based on issues
		if (issues.filter((i) => i.type === "content_length").length > 0) {
			recommendations.push("Expand your content with more detailed explanations and examples");
		}
		if (issues.filter((i) => i.type === "headings").length > 0) {
			recommendations.push("Structure your content with clear H2 and H3 headings");
		}
		if (issues.filter((i) => i.type === "links").length > 0) {
			recommendations.push("Add relevant internal links to other blog posts and external links to authoritative sources");
		}

		return {
			score: Math.max(0, score),
			issues,
			recommendations,
			metrics: {
				wordCount,
				headingCount: headings.length,
				paragraphCount: paragraphs.length,
				linkCount: links.length,
				imageCount: images.length,
				keywordDensity: Object.keys(keywordDensity).length > 0 ? keywordDensity : undefined,
			},
		};
	},
});

export function getSeoScoreInstructions(): string {
	return `
## SEO SCORE TOOL
Analyzes the blog post for SEO best practices.

**When to use:** After writing content, to check optimization and get improvement suggestions

**Parameters:**
- content (string): The blog post content
- title (string, optional): Blog post title
- metaDescription (string, optional): Meta description
- targetKeywords (string[], optional): Keywords to check for
- focusArea (enum): What to analyze - title, headings, body, meta, or all

**Returns:**
- score: 0-100 SEO score
- issues: Array of problems with severity and suggestions
- recommendations: General improvement tips
- metrics: Word count, headings, links, images, keyword density
`;
}

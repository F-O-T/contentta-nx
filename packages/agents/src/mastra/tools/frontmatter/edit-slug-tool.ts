import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const editSlugTool = createTool({
	id: "edit-slug",
	description:
		"Edit the URL slug for the blog post. The slug is the URL-friendly version of the title.",
	inputSchema: z.object({
		slug: z
			.string()
			.regex(
				/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
				"Slug must be lowercase with hyphens only (e.g., 'my-blog-post')",
			)
			.describe("The URL slug (lowercase letters, numbers, and hyphens only)"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		newSlug: z.string(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			newSlug: inputData.slug,
		};
	},
});

export function getEditSlugInstructions(): string {
	return `
## EDIT SLUG TOOL
Updates the URL slug for the blog post.

**When to use:** Setting a custom URL path for the post

**Parameters:**
- slug (string): URL-friendly identifier (lowercase, hyphens, no spaces)

**Format Rules:**
- Lowercase letters only
- Numbers allowed
- Hyphens to separate words
- No spaces or special characters

**Best Practices:**
- Keep short and descriptive
- Include primary keyword
- Avoid stop words (the, a, an, etc.)

**Example:**
slug: "productivity-strategies-entrepreneurs"
`;
}

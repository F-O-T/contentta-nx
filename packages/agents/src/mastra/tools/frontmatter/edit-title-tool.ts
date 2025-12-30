import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const editTitleTool = createTool({
	id: "edit-title",
	description:
		"Edit the blog post title. The title appears at the top of the page and in search results.",
	inputSchema: z.object({
		title: z
			.string()
			.min(1)
			.max(200)
			.describe("The new title for the blog post (1-200 characters)"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		newTitle: z.string(),
	}),
	execute: async (inputData) => {
		// This tool returns instructions for the frontend to execute
		// The actual update happens via frontmatter-tool-executor.ts
		return {
			success: true,
			newTitle: inputData.title,
		};
	},
});

export function getEditTitleInstructions(): string {
	return `
## EDIT TITLE TOOL
Updates the blog post title.

**When to use:** Changing the main title/headline of the post

**Parameters:**
- title (string): The new title (1-200 characters)

**Best Practices:**
- Keep titles under 60 characters for SEO
- Include the primary keyword
- Make it compelling and click-worthy

**Example:**
title: "10 Proven Strategies to Boost Your Productivity"
`;
}

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const editDescriptionTool = createTool({
	id: "edit-description",
	description:
		"Edit the meta description for SEO. This appears in search engine results below the title.",
	inputSchema: z.object({
		description: z
			.string()
			.max(500)
			.describe(
				"The meta description for SEO (recommended: 150-160 characters)",
			),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		newDescription: z.string(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			newDescription: inputData.description,
		};
	},
});

export function getEditDescriptionInstructions(): string {
	return `
## EDIT DESCRIPTION TOOL
Updates the meta description for SEO purposes.

**When to use:** Setting or updating the search engine snippet

**Parameters:**
- description (string): The meta description (max 500 chars, recommended 150-160)

**Best Practices:**
- Keep between 150-160 characters to avoid truncation
- Include the primary keyword naturally
- Write a compelling summary that encourages clicks
- Use active voice and action words

**Example:**
description: "Learn the top 10 productivity strategies used by successful entrepreneurs. Boost your efficiency and accomplish more every day."
`;
}

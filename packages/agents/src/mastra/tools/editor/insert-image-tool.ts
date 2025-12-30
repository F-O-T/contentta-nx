import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertImageTool = createTool({
	id: "insert-image",
	description:
		"Inserts an image into the blog post. Includes alt text for accessibility and optional caption.",
	inputSchema: z.object({
		url: z.string().url().describe("URL of the image"),
		alt: z
			.string()
			.describe("Alt text describing the image for accessibility and SEO. Be descriptive."),
		caption: z
			.string()
			.optional()
			.describe("Optional caption to display below the image"),
		position: z
			.enum(["cursor", "afterParagraph", "end"])
			.default("cursor")
			.describe("Where to insert the image"),
		paragraphIndex: z
			.number()
			.optional()
			.describe("Paragraph index for afterParagraph position"),
		width: z
			.enum(["small", "medium", "large", "full"])
			.optional()
			.default("full")
			.describe("Display width of the image"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		url: z.string(),
		alt: z.string(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			url: inputData.url,
			alt: inputData.alt,
		};
	},
});

export function getInsertImageInstructions(): string {
	return `
## INSERT IMAGE TOOL
Adds an image to the blog post.

**When to use:** Adding visual content, screenshots, diagrams, illustrations

**Parameters:**
- url (string): Full URL to the image
- alt (string): Descriptive alt text (important for SEO and accessibility)
- caption (string, optional): Caption below the image
- position (enum): Where to insert
- paragraphIndex (number, optional): For paragraph-relative positioning
- width (enum, optional): Display size - small, medium, large, full

**Example:**
url: "https://example.com/screenshot.png"
alt: "Dashboard showing the analytics overview with key metrics highlighted"
caption: "The new analytics dashboard"
position: "afterParagraph"
paragraphIndex: 2
`;
}

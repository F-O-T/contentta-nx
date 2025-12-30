import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertHeadingTool = createTool({
	id: "insert-heading",
	description:
		"Inserts a heading (h1-h4) into the blog post. Useful for creating document structure and sections.",
	inputSchema: z.object({
		level: z
			.enum(["h1", "h2", "h3", "h4"])
			.describe("Heading level. Use h1 sparingly (title), h2 for main sections, h3-h4 for subsections"),
		text: z.string().describe("The heading text"),
		position: z
			.enum(["cursor", "afterParagraph", "beforeParagraph", "end"])
			.default("cursor")
			.describe("Where to insert the heading"),
		paragraphIndex: z
			.number()
			.optional()
			.describe("Paragraph index for afterParagraph/beforeParagraph positions"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		level: z.string(),
		text: z.string(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			level: inputData.level,
			text: inputData.text,
		};
	},
});

export function getInsertHeadingInstructions(): string {
	return `
## INSERT HEADING TOOL
Adds a heading to structure the blog post.

**When to use:** Creating sections, adding subheadings, organizing content

**Parameters:**
- level (enum): h1, h2, h3, or h4
  - h1: Main title (use sparingly, usually only one per post)
  - h2: Major sections
  - h3: Subsections
  - h4: Minor subsections
- text (string): Heading text
- position (enum): Where to insert
- paragraphIndex (number, optional): For paragraph-relative positioning

**Example:**
level: "h2"
text: "Getting Started with the Feature"
position: "end"
`;
}

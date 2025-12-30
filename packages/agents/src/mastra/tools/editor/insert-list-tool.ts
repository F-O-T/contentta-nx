import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertListTool = createTool({
	id: "insert-list",
	description:
		"Inserts a list (bullet, numbered, or checklist) into the blog post. Great for organizing information and steps.",
	inputSchema: z.object({
		type: z
			.enum(["bullet", "numbered", "checklist"])
			.describe("Type of list. 'bullet' for unordered, 'numbered' for ordered/steps, 'checklist' for tasks"),
		items: z
			.array(z.string())
			.min(1)
			.describe("Array of list items"),
		position: z
			.enum(["cursor", "afterParagraph", "end"])
			.default("cursor")
			.describe("Where to insert the list"),
		paragraphIndex: z
			.number()
			.optional()
			.describe("Paragraph index for afterParagraph position"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		type: z.string(),
		itemCount: z.number(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			type: inputData.type,
			itemCount: inputData.items.length,
		};
	},
});

export function getInsertListInstructions(): string {
	return `
## INSERT LIST TOOL
Adds a list to the blog post.

**When to use:** Presenting multiple items, steps, features, or tasks

**Parameters:**
- type (enum): List style
  - "bullet": Unordered list (•)
  - "numbered": Ordered list (1, 2, 3...)
  - "checklist": Task list with checkboxes
- items (string[]): Array of list items
- position (enum): Where to insert
- paragraphIndex (number, optional): For paragraph-relative positioning

**Example:**
type: "numbered"
items: ["First step", "Second step", "Third step"]
position: "end"
`;
}

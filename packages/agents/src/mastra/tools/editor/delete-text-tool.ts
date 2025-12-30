import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const deleteTextTool = createTool({
	id: "delete-text",
	description:
		"Deletes text from the editor. Can delete selected text, a pattern match, or specific content.",
	inputSchema: z.object({
		target: z
			.discriminatedUnion("type", [
				z.object({
					type: z.literal("selection"),
				}),
				z.object({
					type: z.literal("pattern"),
					pattern: z.string().describe("Exact text pattern to delete"),
				}),
				z.object({
					type: z.literal("paragraph"),
					index: z.number().describe("Paragraph index to delete (0-based)"),
				}),
				z.object({
					type: z.literal("heading"),
					index: z.number().describe("Heading index to delete (0-based)"),
					includeContent: z
						.boolean()
						.default(false)
						.describe(
							"Whether to also delete content under this heading until the next heading",
						),
				}),
			])
			.describe("What to delete"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		deletedContent: z.string().optional(),
		targetType: z.string(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			targetType: inputData.target.type,
		};
	},
});

export function getDeleteTextInstructions(): string {
	return `
## DELETE TEXT TOOL
Removes text from the blog post.

**When to use:** Removing unnecessary content, cleaning up, restructuring

**Parameters:**
- target (object): What to delete
  - { type: "selection" }: Delete currently selected text
  - { type: "pattern", pattern: "text" }: Delete specific text
  - { type: "paragraph", index: 0 }: Delete paragraph by index
  - { type: "heading", index: 0, includeContent: false }: Delete heading (optionally with its content)

**Example:**
target: { type: "pattern", pattern: "Remove this sentence." }
`;
}

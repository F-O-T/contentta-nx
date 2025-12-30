import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertTextTool = createTool({
	id: "insert-text",
	description:
		"Inserts text at a specific position in the editor. Use this to add new content to the blog post.",
	inputSchema: z.object({
		text: z.string().describe("The text content to insert"),
		position: z
			.enum(["cursor", "start", "end", "afterHeading", "beforeParagraph"])
			.describe(
				"Where to insert the text. 'cursor' = at current cursor, 'start' = beginning of document, 'end' = end of document, 'afterHeading' = after a specific heading, 'beforeParagraph' = before a specific paragraph",
			),
		targetIndex: z
			.number()
			.optional()
			.describe(
				"Target index for afterHeading or beforeParagraph positions (0-based)",
			),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		insertedText: z.string(),
		position: z.string(),
	}),
	execute: async (inputData) => {
		// This tool returns instructions for the frontend to execute
		// The actual DOM manipulation happens in the editor-tool-executor.ts
		return {
			success: true,
			insertedText: inputData.text,
			position: inputData.position,
		};
	},
});

export function getInsertTextInstructions(): string {
	return `
## INSERT TEXT TOOL
Inserts new text content at a specific position in the blog post.

**When to use:** Adding new paragraphs, sentences, or content blocks

**Parameters:**
- text (string): The text to insert
- position (enum): Where to insert
  - "cursor": At current cursor position
  - "start": Beginning of document
  - "end": End of document
  - "afterHeading": After a specific heading (requires targetIndex)
  - "beforeParagraph": Before a specific paragraph (requires targetIndex)
- targetIndex (number, optional): Index for heading/paragraph targeting

**Example:**
text: "This is a new paragraph about the topic."
position: "end"
`;
}

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const formatTextTool = createTool({
	id: "format-text",
	description:
		"Applies formatting to text in the editor. Can make text bold, italic, add links, or apply code formatting.",
	inputSchema: z.object({
		format: z
			.enum(["bold", "italic", "underline", "strikethrough", "code", "link"])
			.describe("The formatting style to apply"),
		scope: z
			.enum(["selection", "word", "paragraph"])
			.default("selection")
			.describe(
				"What to format. 'selection' = selected text, 'word' = word at cursor, 'paragraph' = entire paragraph",
			),
		linkUrl: z
			.string()
			.url()
			.optional()
			.describe("URL for link formatting (required when format is 'link')"),
		searchText: z
			.string()
			.optional()
			.describe(
				"Specific text to format (if not using selection). Will find and format this text.",
			),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		format: z.string(),
		scope: z.string(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			format: inputData.format,
			scope: inputData.scope,
		};
	},
});

export function getFormatTextInstructions(): string {
	return `
## FORMAT TEXT TOOL
Applies text formatting to the blog post content.

**When to use:** Making text bold, italic, adding links, code formatting

**Parameters:**
- format (enum): Formatting type
  - "bold": Makes text bold
  - "italic": Makes text italic
  - "underline": Underlines text
  - "strikethrough": Adds strikethrough
  - "code": Applies inline code formatting
  - "link": Creates a hyperlink (requires linkUrl)
- scope (enum): What to format
  - "selection": Currently selected text
  - "word": Word at cursor
  - "paragraph": Entire paragraph
- linkUrl (string, optional): URL for links
- searchText (string, optional): Specific text to find and format

**Example:**
format: "bold"
scope: "selection"

Or for links:
format: "link"
linkUrl: "https://example.com"
searchText: "click here"
`;
}

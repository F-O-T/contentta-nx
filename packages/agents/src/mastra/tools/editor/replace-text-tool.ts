import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const replaceTextTool = createTool({
	id: "replace-text",
	description:
		"Replaces text in the editor by searching for a pattern and replacing it with new text. Useful for editing and improving existing content.",
	inputSchema: z.object({
		searchText: z
			.string()
			.describe("The exact text to find and replace. Must match exactly."),
		replaceWith: z.string().describe("The new text to replace it with"),
		scope: z
			.enum(["selection", "paragraph", "all"])
			.default("selection")
			.describe(
				"Where to apply the replacement. 'selection' = only in selected text, 'paragraph' = in current paragraph, 'all' = entire document",
			),
		matchCase: z
			.boolean()
			.optional()
			.default(true)
			.describe("Whether to match case exactly"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		replacements: z.number(),
		searchText: z.string(),
		replaceWith: z.string(),
	}),
	execute: async (inputData) => {
		// This tool returns instructions for the frontend to execute
		return {
			success: true,
			replacements: 1, // Estimated, actual count comes from frontend
			searchText: inputData.searchText,
			replaceWith: inputData.replaceWith,
		};
	},
});

export function getReplaceTextInstructions(): string {
	return `
## REPLACE TEXT TOOL
Finds and replaces text in the blog post.

**When to use:** Correcting mistakes, rewording sentences, updating terms

**Parameters:**
- searchText (string): Exact text to find (case-sensitive by default)
- replaceWith (string): New text to use instead
- scope (enum): Where to search
  - "selection": Only in selected text
  - "paragraph": Current paragraph only
  - "all": Entire document
- matchCase (boolean): Whether to match case exactly (default: true)

**Example:**
searchText: "This is confusing text"
replaceWith: "This is clearer text"
scope: "all"
`;
}

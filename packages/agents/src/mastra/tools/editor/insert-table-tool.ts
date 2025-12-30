import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertTableTool = createTool({
	id: "insert-table",
	description:
		"Inserts a table into the blog post. Great for comparing features, showing data, or organizing structured information.",
	inputSchema: z.object({
		headers: z
			.array(z.string())
			.min(1)
			.describe("Array of column headers"),
		rows: z
			.array(z.array(z.string()))
			.min(1)
			.describe("Array of rows, where each row is an array of cell values"),
		position: z
			.enum(["cursor", "afterParagraph", "end"])
			.default("cursor")
			.describe("Where to insert the table"),
		paragraphIndex: z
			.number()
			.optional()
			.describe("Paragraph index for afterParagraph position"),
		caption: z
			.string()
			.optional()
			.describe("Optional table caption"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		columnCount: z.number(),
		rowCount: z.number(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			columnCount: inputData.headers.length,
			rowCount: inputData.rows.length,
		};
	},
});

export function getInsertTableInstructions(): string {
	return `
## INSERT TABLE TOOL
Adds a table to the blog post.

**When to use:** Feature comparisons, data presentation, structured information

**Parameters:**
- headers (string[]): Column header names
- rows (string[][]): 2D array of cell values
- position (enum): Where to insert
- paragraphIndex (number, optional): For paragraph-relative positioning
- caption (string, optional): Table caption/title

**Example:**
headers: ["Feature", "Free", "Pro"]
rows: [
  ["Storage", "5GB", "100GB"],
  ["Users", "1", "Unlimited"],
  ["Support", "Email", "24/7 Priority"]
]
position: "end"
caption: "Plan Comparison"
`;
}

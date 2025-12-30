import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertCodeBlockTool = createTool({
	id: "insert-code-block",
	description:
		"Inserts a code block with syntax highlighting into the blog post. Perfect for technical tutorials and examples.",
	inputSchema: z.object({
		code: z.string().describe("The code content"),
		language: z
			.string()
			.optional()
			.describe("Programming language for syntax highlighting (e.g., 'javascript', 'python', 'typescript', 'bash')"),
		position: z
			.enum(["cursor", "afterParagraph", "end"])
			.default("cursor")
			.describe("Where to insert the code block"),
		paragraphIndex: z
			.number()
			.optional()
			.describe("Paragraph index for afterParagraph position"),
		caption: z
			.string()
			.optional()
			.describe("Optional caption or filename to display above the code"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		language: z.string().optional(),
		lineCount: z.number(),
	}),
	execute: async (inputData) => {
		return {
			success: true,
			language: inputData.language,
			lineCount: inputData.code.split("\n").length,
		};
	},
});

export function getInsertCodeBlockInstructions(): string {
	return `
## INSERT CODE BLOCK TOOL
Adds a code block with syntax highlighting.

**When to use:** Including code examples, configuration snippets, command-line instructions

**Parameters:**
- code (string): The code to display
- language (string, optional): Language for highlighting
  - Common: javascript, typescript, python, bash, json, html, css
- position (enum): Where to insert
- paragraphIndex (number, optional): For paragraph-relative positioning
- caption (string, optional): Filename or description

**Example:**
code: "const greeting = 'Hello World';\\nconsole.log(greeting);"
language: "javascript"
position: "end"
caption: "example.js"
`;
}

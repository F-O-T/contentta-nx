import type { LexicalEditor } from "lexical";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$createTextNode,
	$createParagraphNode,
} from "lexical";
import { $createHeadingNode, type HeadingTagType } from "@lexical/rich-text";
import {
	$createListNode,
	$createListItemNode,
	type ListType,
} from "@lexical/list";
import { $createCodeNode } from "@lexical/code";
import {
	$createTableNode,
	$createTableRowNode,
	$createTableCellNode,
	TableCellHeaderStates,
} from "@lexical/table";
import { $createLinkNode } from "@lexical/link";

/**
 * Tool call received from the Mastra agent
 */
export interface ToolCall {
	id: string;
	name: string;
	args: Record<string, unknown>;
}

/**
 * Result of executing an editor tool
 */
export interface ToolExecutionResult {
	success: boolean;
	message?: string;
	data?: unknown;
}

/**
 * Execute an editor tool call inside the Lexical editor
 *
 * Maps tool names to Lexical operations:
 * - insertText -> creates text/paragraph nodes
 * - insertHeading -> creates heading nodes
 * - insertList -> creates list nodes
 * - insertCodeBlock -> creates code nodes
 * - insertTable -> creates table nodes
 * - replaceText -> finds and replaces text
 * - deleteText -> removes text
 * - formatText -> applies formatting
 * - insertImage -> placeholder for image handling
 *
 * Analysis tools (seo, readability, keyword-density) return data without modifying the editor.
 */
export async function executeEditorTool(
	editor: LexicalEditor,
	toolCall: ToolCall,
): Promise<ToolExecutionResult> {
	const { name, args } = toolCall;

	try {
		switch (name) {
			case "insertText":
				return executeInsertText(editor, args);

			case "insertHeading":
				return executeInsertHeading(editor, args);

			case "insertList":
				return executeInsertList(editor, args);

			case "insertCodeBlock":
				return executeInsertCodeBlock(editor, args);

			case "insertTable":
				return executeInsertTable(editor, args);

			case "insertImage":
				return executeInsertImage(editor, args);

			case "replaceText":
				return executeReplaceText(editor, args);

			case "deleteText":
				return executeDeleteText(editor, args);

			case "formatText":
				return executeFormatText(editor, args);

			// Analysis tools return data without modifying editor
			case "seoScore":
			case "readability":
			case "keywordDensity":
				return {
					success: true,
					message: `Analysis complete: ${name}`,
					data: args,
				};

			// Research tools return data without modifying editor
			case "webSearch":
			case "webCrawl":
			case "serpAnalysis":
			case "competitorContent":
				return {
					success: true,
					message: `Research complete: ${name}`,
					data: args,
				};

			default:
				return {
					success: false,
					message: `Unknown tool: ${name}`,
				};
		}
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Tool execution failed",
		};
	}
}

/**
 * Insert text at a specific position
 */
function executeInsertText(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const text = args.text as string;
	const position = args.position as string;

	editor.update(() => {
		const root = $getRoot();

		switch (position) {
			case "cursor": {
				// Insert at current cursor position
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					selection.insertText(text);
				} else {
					// If no selection, append to end
					const paragraph = $createParagraphNode();
					paragraph.append($createTextNode(text));
					root.append(paragraph);
				}
				break;
			}

			case "start": {
				// Insert at the beginning of the document
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(text));
				const firstChild = root.getFirstChild();
				if (firstChild) {
					firstChild.insertBefore(paragraph);
				} else {
					root.append(paragraph);
				}
				break;
			}

			case "end":
			default: {
				// Insert at the end of the document
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(text));
				root.append(paragraph);
				break;
			}
		}
	});

	return {
		success: true,
		message: `Inserted text at ${position}`,
	};
}

/**
 * Insert a heading
 */
function executeInsertHeading(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const text = args.text as string;
	const level = args.level as number;
	const position = (args.position as string) || "end";

	const headingTag = `h${Math.min(Math.max(level, 1), 6)}` as HeadingTagType;

	editor.update(() => {
		const root = $getRoot();
		const heading = $createHeadingNode(headingTag);
		heading.append($createTextNode(text));

		if (position === "start") {
			const firstChild = root.getFirstChild();
			if (firstChild) {
				firstChild.insertBefore(heading);
			} else {
				root.append(heading);
			}
		} else if (position === "cursor") {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchor = selection.anchor.getNode();
				anchor.getTopLevelElement()?.insertAfter(heading);
			} else {
				root.append(heading);
			}
		} else {
			root.append(heading);
		}
	});

	return {
		success: true,
		message: `Inserted h${level} heading`,
	};
}

/**
 * Insert a list
 */
function executeInsertList(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const items = args.items as string[];
	const listType = args.listType as ListType;
	const position = (args.position as string) || "end";

	editor.update(() => {
		const root = $getRoot();
		const list = $createListNode(listType);

		for (const item of items) {
			const listItem = $createListItemNode();
			listItem.append($createTextNode(item));
			list.append(listItem);
		}

		if (position === "start") {
			const firstChild = root.getFirstChild();
			if (firstChild) {
				firstChild.insertBefore(list);
			} else {
				root.append(list);
			}
		} else if (position === "cursor") {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchor = selection.anchor.getNode();
				anchor.getTopLevelElement()?.insertAfter(list);
			} else {
				root.append(list);
			}
		} else {
			root.append(list);
		}
	});

	return {
		success: true,
		message: `Inserted ${listType} list with ${items.length} items`,
	};
}

/**
 * Insert a code block
 */
function executeInsertCodeBlock(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const code = args.code as string;
	const language = (args.language as string) || "plaintext";
	const position = (args.position as string) || "end";

	editor.update(() => {
		const root = $getRoot();
		const codeNode = $createCodeNode(language);
		codeNode.append($createTextNode(code));

		if (position === "start") {
			const firstChild = root.getFirstChild();
			if (firstChild) {
				firstChild.insertBefore(codeNode);
			} else {
				root.append(codeNode);
			}
		} else if (position === "cursor") {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchor = selection.anchor.getNode();
				anchor.getTopLevelElement()?.insertAfter(codeNode);
			} else {
				root.append(codeNode);
			}
		} else {
			root.append(codeNode);
		}
	});

	return {
		success: true,
		message: `Inserted code block with ${language} syntax`,
	};
}

/**
 * Insert a table
 */
function executeInsertTable(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const rows = args.rows as number;
	const columns = args.columns as number;
	const headers = args.headers as string[] | undefined;
	const position = (args.position as string) || "end";

	editor.update(() => {
		const root = $getRoot();
		const table = $createTableNode();

		// Create header row if headers provided
		if (headers && headers.length > 0) {
			const headerRow = $createTableRowNode();
			for (let i = 0; i < columns; i++) {
				const cell = $createTableCellNode(TableCellHeaderStates.ROW);
				cell.append($createTextNode(headers[i] || `Column ${i + 1}`));
				headerRow.append(cell);
			}
			table.append(headerRow);
		}

		// Create data rows
		const dataRows = headers ? rows - 1 : rows;
		for (let r = 0; r < dataRows; r++) {
			const row = $createTableRowNode();
			for (let c = 0; c < columns; c++) {
				const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
				cell.append($createTextNode(""));
				row.append(cell);
			}
			table.append(row);
		}

		if (position === "start") {
			const firstChild = root.getFirstChild();
			if (firstChild) {
				firstChild.insertBefore(table);
			} else {
				root.append(table);
			}
		} else if (position === "cursor") {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchor = selection.anchor.getNode();
				anchor.getTopLevelElement()?.insertAfter(table);
			} else {
				root.append(table);
			}
		} else {
			root.append(table);
		}
	});

	return {
		success: true,
		message: `Inserted ${rows}x${columns} table`,
	};
}

/**
 * Insert an image (placeholder - requires image handling infrastructure)
 */
function executeInsertImage(
	_editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const src = args.src as string;
	const altText = args.altText as string;

	// Note: Actual image insertion requires an ImageNode to be implemented
	// and registered with the editor. This is a placeholder that returns
	// the image data for the UI to handle.
	return {
		success: true,
		message: "Image data prepared for insertion",
		data: { src, altText, caption: args.caption },
	};
}

/**
 * Replace text by pattern or selection
 */
function executeReplaceText(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const searchText = args.searchText as string;
	const replaceWith = args.replaceWith as string;
	const replaceAll = (args.replaceAll as boolean) ?? false;

	let replacementCount = 0;

	editor.update(() => {
		const root = $getRoot();
		const textContent = root.getTextContent();

		if (replaceAll) {
			// Replace all occurrences
			const occurrences = textContent.split(searchText).length - 1;
			replacementCount = occurrences;
		} else {
			// Replace first occurrence only
			if (textContent.includes(searchText)) {
				replacementCount = 1;
			}
		}

		// Walk through all text nodes and replace
		const walkAndReplace = (node: unknown) => {
			const lexicalNode = node as {
				getTextContent?: () => string;
				setTextContent?: (text: string) => void;
				getChildren?: () => unknown[];
			};

			if (lexicalNode.getTextContent && lexicalNode.setTextContent) {
				const content = lexicalNode.getTextContent();
				if (content.includes(searchText)) {
					if (replaceAll) {
						lexicalNode.setTextContent(
							content.replaceAll(searchText, replaceWith),
						);
					} else {
						lexicalNode.setTextContent(
							content.replace(searchText, replaceWith),
						);
					}
				}
			}

			if (lexicalNode.getChildren) {
				for (const child of lexicalNode.getChildren()) {
					walkAndReplace(child);
				}
			}
		};

		walkAndReplace(root);
	});

	return {
		success: true,
		message: `Replaced ${replacementCount} occurrence(s)`,
		data: { replacementCount },
	};
}

/**
 * Delete text by range or pattern
 */
function executeDeleteText(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const searchText = args.searchText as string | undefined;
	const deleteAll = (args.deleteAll as boolean) ?? false;

	if (!searchText) {
		return {
			success: false,
			message: "No search text provided for deletion",
		};
	}

	let deletionCount = 0;

	editor.update(() => {
		const root = $getRoot();

		// Walk through all text nodes and delete matching text
		const walkAndDelete = (node: unknown) => {
			const lexicalNode = node as {
				getTextContent?: () => string;
				setTextContent?: (text: string) => void;
				getChildren?: () => unknown[];
			};

			if (lexicalNode.getTextContent && lexicalNode.setTextContent) {
				const content = lexicalNode.getTextContent();
				if (content.includes(searchText)) {
					if (deleteAll) {
						const occurrences = content.split(searchText).length - 1;
						deletionCount += occurrences;
						lexicalNode.setTextContent(content.replaceAll(searchText, ""));
					} else if (deletionCount === 0) {
						deletionCount = 1;
						lexicalNode.setTextContent(content.replace(searchText, ""));
					}
				}
			}

			if (lexicalNode.getChildren) {
				for (const child of lexicalNode.getChildren()) {
					walkAndDelete(child);
				}
			}
		};

		walkAndDelete(root);
	});

	return {
		success: true,
		message: `Deleted ${deletionCount} occurrence(s)`,
		data: { deletionCount },
	};
}

/**
 * Apply formatting to selected or matched text
 */
function executeFormatText(
	editor: LexicalEditor,
	args: Record<string, unknown>,
): ToolExecutionResult {
	const format = args.format as string;
	const text = args.text as string | undefined;
	const url = args.url as string | undefined;

	editor.update(() => {
		const selection = $getSelection();

		if (!$isRangeSelection(selection)) {
			return;
		}

		switch (format) {
			case "bold":
				selection.formatText("bold");
				break;
			case "italic":
				selection.formatText("italic");
				break;
			case "underline":
				selection.formatText("underline");
				break;
			case "strikethrough":
				selection.formatText("strikethrough");
				break;
			case "code":
				selection.formatText("code");
				break;
			case "link":
				if (url) {
					// For links, we need to wrap selection in a link node
					const selectedText = selection.getTextContent() || text || url;
					const linkNode = $createLinkNode(url);
					linkNode.append($createTextNode(selectedText));
					selection.insertNodes([linkNode]);
				}
				break;
		}
	});

	return {
		success: true,
		message: `Applied ${format} formatting`,
	};
}

/**
 * Get the current editor content as plain text
 */
export function getEditorContent(editor: LexicalEditor): string {
	let content = "";

	editor.getEditorState().read(() => {
		const root = $getRoot();
		content = root.getTextContent();
	});

	return content;
}

/**
 * Get the current selection text
 */
export function getSelectionText(editor: LexicalEditor): string {
	let selectedText = "";

	editor.getEditorState().read(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			selectedText = selection.getTextContent();
		}
	});

	return selectedText;
}

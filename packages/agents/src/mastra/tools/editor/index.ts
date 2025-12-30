import { deleteTextTool, getDeleteTextInstructions } from "./delete-text-tool";
import { formatTextTool, getFormatTextInstructions } from "./format-text-tool";
import {
	getInsertCodeBlockInstructions,
	insertCodeBlockTool,
} from "./insert-code-block-tool";
import {
	getInsertHeadingInstructions,
	insertHeadingTool,
} from "./insert-heading-tool";
import {
	getInsertImageInstructions,
	insertImageTool,
} from "./insert-image-tool";
import {
	getInsertListInstructions,
	insertListTool,
} from "./insert-list-tool";
import {
	getInsertTableInstructions,
	insertTableTool,
} from "./insert-table-tool";
import {
	getInsertTextInstructions,
	insertTextTool,
} from "./insert-text-tool";
import {
	getReplaceTextInstructions,
	replaceTextTool,
} from "./replace-text-tool";

// Re-export tools
export { deleteTextTool, getDeleteTextInstructions } from "./delete-text-tool";
export { formatTextTool, getFormatTextInstructions } from "./format-text-tool";
export {
	getInsertCodeBlockInstructions,
	insertCodeBlockTool,
} from "./insert-code-block-tool";
export {
	getInsertHeadingInstructions,
	insertHeadingTool,
} from "./insert-heading-tool";
export {
	getInsertImageInstructions,
	insertImageTool,
} from "./insert-image-tool";
export {
	getInsertListInstructions,
	insertListTool,
} from "./insert-list-tool";
export {
	getInsertTableInstructions,
	insertTableTool,
} from "./insert-table-tool";
export {
	getInsertTextInstructions,
	insertTextTool,
} from "./insert-text-tool";
export {
	getReplaceTextInstructions,
	replaceTextTool,
} from "./replace-text-tool";

// Combined instructions for all editor tools
export function getAllEditorToolInstructions(): string {
	return `
# EDITOR TOOLS
These tools allow you to manipulate the blog post content directly.

${getInsertTextInstructions()}
${getReplaceTextInstructions()}
${getDeleteTextInstructions()}
${getFormatTextInstructions()}
${getInsertHeadingInstructions()}
${getInsertListInstructions()}
${getInsertCodeBlockInstructions()}
${getInsertTableInstructions()}
${getInsertImageInstructions()}
`;
}

// All editor tools as an object for agent registration
export const editorTools = {
	insertText: insertTextTool,
	replaceText: replaceTextTool,
	deleteText: deleteTextTool,
	formatText: formatTextTool,
	insertHeading: insertHeadingTool,
	insertList: insertListTool,
	insertCodeBlock: insertCodeBlockTool,
	insertTable: insertTableTool,
	insertImage: insertImageTool,
};

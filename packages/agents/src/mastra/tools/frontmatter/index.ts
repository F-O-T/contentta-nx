import { editTitleTool, getEditTitleInstructions } from "./edit-title-tool";
import {
	editDescriptionTool,
	getEditDescriptionInstructions,
} from "./edit-description-tool";
import { editSlugTool, getEditSlugInstructions } from "./edit-slug-tool";
import {
	editKeywordsTool,
	getEditKeywordsInstructions,
} from "./edit-keywords-tool";

// Re-export tools
export { editTitleTool, getEditTitleInstructions } from "./edit-title-tool";
export {
	editDescriptionTool,
	getEditDescriptionInstructions,
} from "./edit-description-tool";
export { editSlugTool, getEditSlugInstructions } from "./edit-slug-tool";
export {
	editKeywordsTool,
	getEditKeywordsInstructions,
} from "./edit-keywords-tool";

/**
 * All frontmatter editing tools bundled together
 */
export const frontmatterTools = {
	editTitle: editTitleTool,
	editDescription: editDescriptionTool,
	editSlug: editSlugTool,
	editKeywords: editKeywordsTool,
};

/**
 * Get all frontmatter tool instructions for the agent system prompt
 */
export function getAllFrontmatterToolInstructions(): string {
	return [
		getEditTitleInstructions(),
		getEditDescriptionInstructions(),
		getEditSlugInstructions(),
		getEditKeywordsInstructions(),
	].join("\n");
}

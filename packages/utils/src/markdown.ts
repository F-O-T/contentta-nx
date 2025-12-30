/**
 * Re-exports from @packages/markdown for backwards compatibility
 * @deprecated Import from @packages/markdown directly
 */

export {
	extractTitle as extractTitleFromMarkdown,
	removeTitle as removeTitleFromMarkdown,
	parseToHtml as parseMarkdownIntoHtml,
	analyzeContentStructure,
} from "@packages/markdown";

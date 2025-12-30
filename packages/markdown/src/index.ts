/**
 * @packages/markdown - Internal re-export of @f-o-t/markdown
 *
 * This package wraps the public @f-o-t/markdown library for internal use.
 */

export {
	// Parsing
	extractTitle,
	removeTitle,
	// Slug
	generateSlug,
	// HTML
	parseToHtml,
	// Analysis
	analyzeContentStructure,
	type ContentStructure,
	type ContentAnalysis,
} from "@f-o-t/markdown";

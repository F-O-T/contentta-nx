/**
 * @packages/markdown - Internal re-export of @f-o-t/markdown
 *
 * This package wraps the public @f-o-t/markdown library for internal use.
 */

export {
	// Parsing
	parse,
	parseToAst,
	parseOrThrow,
	extractText,
	getHeadings,
	countWords,
	// Generation
	generate,
	generateHeadingString,
} from "@f-o-t/markdown";

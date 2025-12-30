import {
	competitorContentTool,
	getCompetitorContentInstructions,
} from "./competitor-content-tool";
import {
	getSerpAnalysisInstructions,
	serpAnalysisTool,
} from "./serp-analysis-tool";
import { getWebCrawlInstructions, webCrawlTool } from "./web-crawl-tool";
import { getWebSearchInstructions, webSearchTool } from "./web-search-tool";

// Re-export tools and instructions
export {
	competitorContentTool,
	getCompetitorContentInstructions,
} from "./competitor-content-tool";
export {
	getSerpAnalysisInstructions,
	serpAnalysisTool,
} from "./serp-analysis-tool";
export { getWebCrawlInstructions, webCrawlTool } from "./web-crawl-tool";
export { getWebSearchInstructions, webSearchTool } from "./web-search-tool";

// Combined instructions for all research tools
export function getAllResearchToolInstructions(): string {
	return `
# RESEARCH TOOLS
These tools help you research and gather information for your blog post.

${getWebSearchInstructions()}
${getWebCrawlInstructions()}
${getSerpAnalysisInstructions()}
${getCompetitorContentInstructions()}
`;
}

// All research tools as an object for agent registration
export const researchTools = {
	webSearch: webSearchTool,
	webCrawl: webCrawlTool,
	serpAnalysis: serpAnalysisTool,
	competitorContent: competitorContentTool,
};

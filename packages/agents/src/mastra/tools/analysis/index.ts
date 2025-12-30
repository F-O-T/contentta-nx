import {
	getKeywordDensityInstructions,
	keywordDensityTool,
} from "./keyword-density-tool";
import { getReadabilityInstructions, readabilityTool } from "./readability-tool";
import { getSeoScoreInstructions, seoScoreTool } from "./seo-score-tool";

// Re-export tools and instructions
export {
	getKeywordDensityInstructions,
	keywordDensityTool,
} from "./keyword-density-tool";
export { getReadabilityInstructions, readabilityTool } from "./readability-tool";
export { getSeoScoreInstructions, seoScoreTool } from "./seo-score-tool";

// Combined instructions for all analysis tools
export function getAllAnalysisToolInstructions(): string {
	return `
# ANALYSIS TOOLS
These tools analyze the blog post for quality, SEO, and readability.

${getSeoScoreInstructions()}
${getReadabilityInstructions()}
${getKeywordDensityInstructions()}
`;
}

// All analysis tools as an object for agent registration
export const analysisTools = {
	seoScore: seoScoreTool,
	readability: readabilityTool,
	keywordDensity: keywordDensityTool,
};

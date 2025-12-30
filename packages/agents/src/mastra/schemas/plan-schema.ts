import { z } from "zod";

/**
 * A single step in the content plan
 */
export const PlanStepSchema = z.object({
	id: z.string().describe("Unique step identifier (e.g., step-1, step-2)"),
	title: z
		.string()
		.describe("Short title for the step (e.g., 'Add introduction section')"),
	description: z
		.string()
		.describe(
			"Detailed description of what will be done in this step, including specific markdown content",
		),
	toolsToUse: z
		.array(z.string())
		.describe(
			"Tools that will be used (e.g., ['insertHeading', 'insertText', 'editTitle'])",
		),
	rationale: z
		.string()
		.describe("Why this step is important based on research findings"),
	estimatedMarkdown: z
		.string()
		.optional()
		.describe("Preview of the markdown content to be added"),
});

/**
 * Research insights gathered from SERP and competitor analysis
 */
export const ResearchInsightsSchema = z.object({
	serpIntent: z
		.string()
		.describe("What users are searching for and their intent"),
	topRankingTopics: z
		.array(z.string())
		.describe("Key topics covered by top-ranking content"),
	competitorStrengths: z
		.array(z.string())
		.describe("What competitors are doing well"),
	contentGaps: z
		.array(z.string())
		.describe("Opportunities to add unique value"),
	suggestedKeywords: z
		.array(z.string())
		.describe("Keywords to target based on research"),
});

/**
 * Complete content plan with research insights and action steps
 */
export const ContentPlanSchema = z.object({
	summary: z
		.string()
		.describe("Brief summary of the overall plan (1-2 sentences)"),
	researchInsights: ResearchInsightsSchema.describe(
		"Insights gathered from SERP and competitor analysis",
	),
	steps: z
		.array(PlanStepSchema)
		.min(1)
		.max(15)
		.describe("Ordered list of steps to execute (1-15 steps)"),
	estimatedWordCount: z
		.number()
		.describe("Target word count for the final content"),
	targetKeywords: z
		.array(z.string())
		.describe("Primary and secondary keywords to target"),
	suggestedTitle: z
		.string()
		.optional()
		.describe("Suggested SEO-optimized title if title change is recommended"),
	suggestedDescription: z
		.string()
		.optional()
		.describe("Suggested meta description for SEO"),
});

export type PlanStep = z.infer<typeof PlanStepSchema>;
export type ResearchInsights = z.infer<typeof ResearchInsightsSchema>;
export type ContentPlan = z.infer<typeof ContentPlanSchema>;

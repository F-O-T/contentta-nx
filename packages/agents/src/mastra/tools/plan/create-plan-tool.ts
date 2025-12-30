import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Schema for a single plan step
 */
const PlanStepSchema = z.object({
	id: z.string().describe("Unique identifier for the step (e.g., 'step-1')"),
	title: z.string().describe("Short action title (e.g., 'Write introduction')"),
	description: z.string().describe("Detailed description of what this step will do"),
	toolsToUse: z
		.array(z.string())
		.optional()
		.describe("List of tool names to use for this step"),
	rationale: z.string().optional().describe("Why this step matters based on research"),
});

/**
 * Schema for the createPlan tool input/output
 */
const CreatePlanInputSchema = z.object({
	summary: z.string().describe("Brief 1-2 sentence summary of the plan"),
	steps: z
		.array(PlanStepSchema)
		.min(1)
		.max(10)
		.describe("Array of plan steps (1-10 steps)"),
});

export type CreatePlanInput = z.infer<typeof CreatePlanInputSchema>;
export type PlanStepInput = z.infer<typeof PlanStepSchema>;

/**
 * Creates a structured content plan for user approval.
 * The plan will be displayed in a special UI where users can approve/skip individual steps.
 */
export const createPlanTool = createTool({
	id: "createPlan",
	description:
		"Creates a structured content plan for user approval. MUST be called after completing research to present the plan. The user will see a UI where they can approve or skip individual steps before execution.",
	inputSchema: CreatePlanInputSchema,
	outputSchema: CreatePlanInputSchema,
	execute: async (input) => {
		// Simply return the input - the frontend will handle display
		// The tool acts as a structured way to pass plan data to the UI
		return input;
	},
});

export function getCreatePlanInstructions(): string {
	return `
## CREATE PLAN TOOL
Creates a structured content plan that the user can review and approve.

**When to use:** ALWAYS call this tool AFTER completing research with serpAnalysis and competitorContent. This is the ONLY way to present your plan to the user.

**CRITICAL:** DO NOT write out the plan as plain text. You MUST use this tool to present the plan.

**Parameters:**
- summary (string): Brief 1-2 sentence summary of the plan
- steps (array): Array of step objects (1-10 steps), each with:
  - id: Unique identifier (e.g., "step-1", "step-2")
  - title: Short action title (e.g., "Write introduction section")
  - description: Detailed description of what this step will accomplish
  - toolsToUse: Optional array of tool names that will be used
  - rationale: Optional explanation of why this step matters

**Example:**
\`\`\`json
{
  "summary": "Create a comprehensive guide about React hooks based on SERP analysis",
  "steps": [
    {
      "id": "step-1",
      "title": "Write introduction section",
      "description": "Create an engaging introduction that explains what React hooks are and why they matter",
      "toolsToUse": ["insertHeading", "insertText"],
      "rationale": "Top-ranking articles all have strong introductions"
    },
    {
      "id": "step-2",
      "title": "Add useState examples",
      "description": "Include practical code examples showing useState in action",
      "toolsToUse": ["insertHeading", "insertCodeBlock", "insertText"],
      "rationale": "Competitors include 3-5 code examples on average"
    }
  ]
}
\`\`\`

**User Experience:**
After you call this tool, the user will see a visual plan with checkboxes to approve or skip each step. Once they click "Execute", the approved steps will be executed in writer mode.
`;
}

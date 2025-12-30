import {
	createPlanTool,
	getCreatePlanInstructions,
} from "./create-plan-tool";

// Re-export for convenience
export {
	createPlanTool,
	getCreatePlanInstructions,
	type CreatePlanInput,
	type PlanStepInput,
} from "./create-plan-tool";

// Combined instructions for all plan tools
export function getAllPlanToolInstructions(): string {
	return `
# PLAN TOOLS
These tools help you create and present structured plans.

${getCreatePlanInstructions()}
`;
}

// All plan tools as an object for agent registration
export const planTools = {
	createPlan: createPlanTool,
};

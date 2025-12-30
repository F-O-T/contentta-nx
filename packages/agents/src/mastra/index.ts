import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { PinoLogger } from "@mastra/loggers";
import type { SupportedLng } from "@packages/localization";
import { blogEditorAgent } from "./agents/blog-editor-agent";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";

// Chat modes for blog editor
export type ChatMode = "plan" | "writer";

// Available models
export type ModelId =
	| "x-ai/grok-4.1-fast"
	| "z-ai/glm-4.7"
	| "mistralai/mistral-small-creative";

export type CustomRequestContext = {
	brandId?: string;
	language?: SupportedLng;
	userId: string;
	agentId?: string;
	// New fields for blog editor
	mode?: ChatMode;
	model?: ModelId;
};

export const mastra = new Mastra({
	agents: {
		blogEditorAgent,
		fimAgent,
		inlineEditAgent,
	},
	bundler: {
		transpilePackages: [
			"@packages/files/client",
			"@packages/environment/helpers",
			"@packages/environment/server",
			"@packages/database/client",
			"@packages/database/schema",
			"@packages/rag/client",
			"@packages/utils/errors",
			"@packages/utils/text",
		],
	},
	logger: new PinoLogger({
		level: "info",
		name: "Mastra",
	}),
});

export function createRequestContext(context: CustomRequestContext) {
   const requestContext = new RequestContext<CustomRequestContext>();
   requestContext.set("userId", context.userId);
   if (context.language) {
      requestContext.set("language", context.language);
   }

   if (context.brandId) {
      requestContext.set("brandId", context.brandId);
   }
   if (context.agentId) {
      requestContext.set("agentId", context.agentId);
   }
   if (context.mode) {
      requestContext.set("mode", context.mode);
   }
   if (context.model) {
      requestContext.set("model", context.model);
   }
   return requestContext;
}

// Export agents for direct access
export { blogEditorAgent } from "./agents/blog-editor-agent";
export { fimAgent } from "./agents/fim-agent";
export { inlineEditAgent } from "./agents/inline-edit-agent";

// Export plan schemas
export {
	ContentPlanSchema,
	PlanStepSchema,
	ResearchInsightsSchema,
	type ContentPlan,
	type PlanStep,
	type ResearchInsights,
} from "./schemas/plan-schema";

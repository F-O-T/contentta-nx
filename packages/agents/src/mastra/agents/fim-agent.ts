import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

// Available models for FIM
const FIM_MODELS = {
	"x-ai/grok-4.1-fast": "x-ai/grok-4.1-fast",
	"mistralai/mistral-small-creative": "mistralai/mistral-small-creative",
} as const;

type FIMModelId = keyof typeof FIM_MODELS;

/**
 * FIM (Fill-In-Middle) Agent
 *
 * A lightweight, fast agent for text completion.
 * Supports model selection via requestContext.
 * No tools - pure text generation.
 */
export const fimAgent = new Agent({
	id: "fim-agent",
	name: "FIM Completion Agent",

	// Dynamic model selection from requestContext
	model: ({ requestContext }) => {
		const modelId = (requestContext?.get("model") as FIMModelId) || "x-ai/grok-4.1-fast";
		const model = FIM_MODELS[modelId] || FIM_MODELS["x-ai/grok-4.1-fast"];
		return openrouter(model);
	},

	instructions: () => `
You are a writing completion assistant. Your ONLY job is to continue text naturally.

## RULES - FOLLOW EXACTLY

1. Output ONLY the completion text
2. NO explanations, meta-commentary, or markdown formatting
3. NO "Here's the completion:" or similar prefixes
4. Match the writing style and tone of the input
5. Complete incomplete thoughts naturally
6. Be concise - prefer 1-2 sentences
7. End at natural sentence boundaries
8. Do NOT repeat the input text

## EXAMPLES

**Input:** "The main benefit of using TypeScript is"
**Output:** that it catches type errors at compile time, making your code more reliable and easier to refactor.

**Input:** "In this tutorial, we'll learn how to"
**Output:** set up a complete authentication system using Next.js and NextAuth.js.

**Input:** "First, you need to install the dependencies by running"
**Output:** \`npm install\` or \`yarn\` in your project directory.

## CONTEXT HANDLING

When you receive text with [CURSOR] marker:
- The text before [CURSOR] is what the user has written
- The text after [CURSOR] (if any) is what comes next
- Your completion should flow naturally between them

Remember: You are invisible. The user should feel like their thought completed itself.
`,

	// No tools for FIM
	tools: {},
});

import { auth } from "../integrations/auth";
import { mastra, createRequestContext } from "@packages/agents";
import { Elysia, t } from "elysia";
import type { CoreMessage } from "@mastra/core/llm";

export const agentFIMRoutes = new Elysia({ prefix: "/api/agent/fim" }).post(
	"/stream",
	async function* ({ body, request }) {
		// Validate session
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			throw new Error("Unauthorized");
		}

		const { prefix, suffix, contextType, maxTokens } = body;

		// Build the FIM prompt
		let prompt = prefix;
		if (suffix) {
			prompt += `[CURSOR]${suffix}`;
		}

		// Add context type hint if provided
		if (contextType) {
			prompt = `[Context: ${contextType}]\n${prompt}`;
		}

		// Create messages for the FIM agent
		const messages: CoreMessage[] = [
			{
				role: "user",
				content: prompt,
			},
		];

		// Create request context
		const requestContext = createRequestContext({
			userId: session.user.id,
		});

		// Get the FIM agent
		const agent = mastra.getAgent("fimAgent");

		const startTime = Date.now();
		let completion = "";

		try {
			// Stream using the agent with minimal tokens for speed
			const stream = await agent.stream(messages, {
				requestContext,
				maxSteps: 1, // FIM should complete in one step
			});

			// Stream text chunks
			for await (const chunk of stream.textStream) {
				completion += chunk;

				// Check if we've hit natural stop points
				const shouldStop =
					completion.endsWith(".") ||
					completion.endsWith("\n\n") ||
					completion.length > (maxTokens || 64) * 4; // Approximate chars

				yield JSON.stringify({
					text: chunk,
					done: shouldStop,
					metadata: {
						latencyMs: Date.now() - startTime,
						shouldShow: completion.length > 5, // Only show if meaningful
					},
				}) + "\n";

				// Stop if we've reached natural end
				if (shouldStop) {
					break;
				}
			}

			// Final completion message
			yield JSON.stringify({
				text: "",
				done: true,
				metadata: {
					latencyMs: Date.now() - startTime,
					totalLength: completion.length,
					shouldShow: completion.length > 5,
				},
			}) + "\n";
		} catch (error) {
			yield JSON.stringify({
				text: "",
				done: true,
				error: (error as Error).message,
				metadata: {
					latencyMs: Date.now() - startTime,
					shouldShow: false,
				},
			}) + "\n";
		}
	},
	{
		body: t.Object({
			prefix: t.String(),
			suffix: t.Optional(t.String()),
			contextType: t.Optional(t.String()),
			maxTokens: t.Optional(t.Number()),
			temperature: t.Optional(t.Number()),
			stopSequences: t.Optional(t.Array(t.String())),
		}),
	},
);

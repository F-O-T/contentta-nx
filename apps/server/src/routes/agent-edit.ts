import { auth } from "../integrations/auth";
import { mastra, createRequestContext } from "@packages/agents";
import { Elysia, t } from "elysia";
import type { CoreMessage } from "@mastra/core/llm";

export const agentEditRoutes = new Elysia({ prefix: "/api/agent/edit" }).post(
	"/stream",
	async function* ({ body, request }) {
		// Validate session
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			throw new Error("Unauthorized");
		}

		const { selectedText, instruction, contextBefore, contextAfter } = body;

		// Build the edit prompt with context
		let prompt = `## INSTRUCTION\n${instruction}\n\n## SELECTED TEXT\n${selectedText}`;

		if (contextBefore) {
			prompt = `## CONTEXT BEFORE\n${contextBefore}\n\n${prompt}`;
		}
		if (contextAfter) {
			prompt = `${prompt}\n\n## CONTEXT AFTER\n${contextAfter}`;
		}

		// Create messages for the inline edit agent
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

		// Get the inline edit agent
		const agent = mastra.getAgent("inlineEditAgent");

		const startTime = Date.now();
		let transformedText = "";

		try {
			// Stream using the agent
			const stream = await agent.stream(messages, {
				requestContext,
				maxSteps: 1, // Inline edit should complete in one step
			});

			// Stream text chunks
			for await (const chunk of stream.textStream) {
				transformedText += chunk;

				yield JSON.stringify({
					text: chunk,
					done: false,
					metadata: {
						latencyMs: Date.now() - startTime,
					},
				}) + "\n";
			}

			// Final completion message
			yield JSON.stringify({
				text: "",
				done: true,
				fullText: transformedText,
				metadata: {
					latencyMs: Date.now() - startTime,
					originalLength: selectedText.length,
					newLength: transformedText.length,
				},
			}) + "\n";
		} catch (error) {
			yield JSON.stringify({
				text: "",
				done: true,
				error: (error as Error).message,
				metadata: {
					latencyMs: Date.now() - startTime,
				},
			}) + "\n";
		}
	},
	{
		body: t.Object({
			selectedText: t.String(),
			instruction: t.String(),
			contextBefore: t.Optional(t.String()),
			contextAfter: t.Optional(t.String()),
			maxTokens: t.Optional(t.Number()),
			temperature: t.Optional(t.Number()),
		}),
	},
);

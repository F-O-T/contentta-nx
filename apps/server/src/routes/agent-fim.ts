import { auth } from "../integrations/auth";
import { mastra, createRequestContext } from "@packages/agents";
import { Elysia, t } from "elysia";
import type { CoreMessage } from "@mastra/core/llm";
import {
	calculateConfidence,
	type FIMStopReason,
} from "@packages/agents/mastra/utils/fim-confidence";

/**
 * Detect article context based on cursor position
 */
function detectArticleContext(prefix: string, suffix: string): string {
	const totalLength = prefix.length + suffix.length;
	if (totalLength === 0) return "body";

	const prefixRatio = prefix.length / totalLength;

	if (prefixRatio < 0.15) return "introduction";
	if (prefixRatio > 0.85) return "conclusion";
	return "body";
}

/**
 * Prose-aware stop condition
 * More intelligent than just stopping at first period
 */
function shouldStopForProse(
	completion: string,
	maxTokens: number,
	articleContext: string,
): { shouldStop: boolean; reason: FIMStopReason } {
	// Never stop mid-word
	if (
		completion.length > 0 &&
		!/\s$/.test(completion) &&
		!/[.!?,;:]$/.test(completion)
	) {
		return { shouldStop: false, reason: "natural" };
	}

	// Token limit
	if (completion.length > maxTokens * 4) {
		return { shouldStop: true, reason: "token_limit" };
	}

	// Double newline is always a stop
	if (completion.endsWith("\n\n")) {
		return { shouldStop: true, reason: "stop_sequence" };
	}

	// Count sentences
	const sentenceCount = (completion.match(/[.!?]/g) || []).length;

	// For introductions, allow multi-sentence completions
	if (articleContext === "introduction") {
		if (sentenceCount >= 2) {
			return { shouldStop: true, reason: "natural" };
		}
		return { shouldStop: false, reason: "natural" };
	}

	// For body/conclusion, stop after 1-2 sentences
	if (sentenceCount >= 2) {
		return { shouldStop: true, reason: "natural" };
	}

	// Stop at sentence end if we have reasonable length
	if (completion.length > 50 && /[.!?]\s*$/.test(completion)) {
		return { shouldStop: true, reason: "natural" };
	}

	return { shouldStop: false, reason: "natural" };
}

export const agentFIMRoutes = new Elysia({ prefix: "/api/agent/fim" }).post(
	"/stream",
	async function* ({ body, request }) {
		// Validate session
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			throw new Error("Unauthorized");
		}

		const {
			prefix,
			suffix,
			maxTokens = 100, // Increased default for prose
			recentText,
			triggerType = "debounce",
		} = body;

		// Detect article structure
		const articleContext = detectArticleContext(prefix, suffix || "");

		// Build the FIM prompt with article context
		let prompt = prefix;
		if (suffix) {
			prompt += `[CURSOR]${suffix}`;
		}
		prompt = `[Article Section: ${articleContext}]\n${prompt}`;

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
		let stopReason: FIMStopReason = "natural";

		try {
			// Stream using the agent
			const stream = await agent.stream(messages, {
				requestContext,
				maxSteps: 1, // FIM should complete in one step
			});

			// Stream text chunks
			for await (const chunk of stream.textStream) {
				completion += chunk;

				// Check prose-aware stop conditions
				const stopCheck = shouldStopForProse(
					completion,
					maxTokens,
					articleContext,
				);
				stopReason = stopCheck.reason;

				yield JSON.stringify({
					text: chunk,
					done: stopCheck.shouldStop,
					metadata: {
						latencyMs: Date.now() - startTime,
						articleContext,
					},
				}) + "\n";

				// Stop if we've reached natural end
				if (stopCheck.shouldStop) {
					break;
				}
			}

			// Calculate confidence score
			const confidence = calculateConfidence({
				completion,
				prefix,
				recentText: recentText || prefix.slice(-100),
				latencyMs: Date.now() - startTime,
				stopReason,
				triggerType,
			});

			// Final completion message with confidence scoring
			yield JSON.stringify({
				text: "",
				done: true,
				metadata: {
					latencyMs: Date.now() - startTime,
					totalLength: completion.length,
					shouldShow: confidence.shouldShow,
					confidence: confidence.score,
					factors: confidence.factors,
					stopReason,
					articleContext,
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
			maxTokens: t.Optional(t.Number()),
			temperature: t.Optional(t.Number()),
			stopSequences: t.Optional(t.Array(t.String())),
			triggerType: t.Optional(t.String()),
			recentText: t.Optional(t.String()),
			editContext: t.Optional(
				t.Object({
					intent: t.String(),
					cursorDistanceFromEnd: t.Number(),
					isInEditingMode: t.Boolean(),
					isAfterIncomplete: t.Optional(t.Boolean()),
					hasSentencePattern: t.Optional(t.Boolean()),
				}),
			),
		}),
	},
);

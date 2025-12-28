import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import { createToolSystemPrompt } from "../../helpers";
import { dateTool, getDateToolInstructions } from "../../tools/date-tool";
import {
	getAudienceProfileGuidelinesInstructions,
	getAudienceProfileGuidelinesTool,
} from "../../tools/get-audience-profile-guidelines-tool";
import { articleReaderInstructions } from "./instructions/article";
import { changelogReaderInstructions } from "./instructions/changelog";
import { tutorialReaderInstructions } from "./instructions/tutorial";

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

export type ContentType = "article" | "changelog" | "tutorial";

const readerInstructions: Record<ContentType, string> = {
	article: articleReaderInstructions,
	changelog: changelogReaderInstructions,
	tutorial: tutorialReaderInstructions,
};

const languageNames = {
	en: "English",
	pt: "Portuguese",
} as const;

function getLanguageInstruction(
	language: "en" | "pt",
	contentType: ContentType,
): string {
	const contentTypeLabels: Record<ContentType, string> = {
		article: "article",
		changelog: "changelog",
		tutorial: "tutorial",
	};
	return `You MUST provide all ${contentTypeLabels[contentType]} evaluation output in ${languageNames[language]}.`;
}

function getToolsForContentType(contentType: ContentType) {
	const baseTools = { dateTool };
	const baseInstructions = [getDateToolInstructions()];

	if (contentType === "article") {
		return {
			tools: { ...baseTools, getAudiencePersona: getAudienceProfileGuidelinesTool },
			instructions: [...baseInstructions, getAudienceProfileGuidelinesInstructions()],
		};
	}
	return {
		tools: baseTools,
		instructions: baseInstructions,
	};
}

export function createReaderAgent(contentType: ContentType) {
	const contentInstructions = readerInstructions[contentType];
	const { tools, instructions: toolInstructions } =
		getToolsForContentType(contentType);
	const agentId = `${contentType}-reader`;
	const agentName = `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Requirements Evaluator`;

	return new Agent({
		id: agentId,
		instructions: ({ requestContext }) => {
			const locale = requestContext.get("language") as "en" | "pt";
			return `${contentInstructions}

${getLanguageInstruction(locale ?? "en", contentType)}

${createToolSystemPrompt(toolInstructions)}`;
		},
		model: openrouter("x-ai/grok-4-fast"),
		name: agentName,
		tools,
	});
}

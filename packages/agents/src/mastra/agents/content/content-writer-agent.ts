import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import { createToolSystemPrompt } from "../../helpers";
import { dateTool, getDateToolInstructions } from "../../tools/date-tool";
import {
	getWritingGuidelinesInstructions,
	getWritingGuidelinesTool,
} from "../../tools/get-writing-guidelines-tool";
import { articleWriterInstructions } from "./instructions/article";
import { changelogWriterInstructions } from "./instructions/changelog";
import { tutorialWriterInstructions } from "./instructions/tutorial";

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

export type ContentType = "article" | "changelog" | "tutorial";

const writerInstructions: Record<ContentType, string> = {
	article: articleWriterInstructions,
	changelog: changelogWriterInstructions,
	tutorial: tutorialWriterInstructions,
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
	return `
## OUTPUT LANGUAGE REQUIREMENT
You MUST provide ALL your ${contentTypeLabels[contentType]} content in ${languageNames[language]}.
Your entire output must be written in ${languageNames[language]}.
`;
}

function getToolsForContentType(contentType: ContentType) {
	const baseTools = { dateTool };
	const baseInstructions = [getDateToolInstructions()];

	if (contentType === "article") {
		return {
			tools: { ...baseTools, getWritingGuidelinesTool },
			instructions: [...baseInstructions, getWritingGuidelinesInstructions()],
		};
	}
	return {
		tools: baseTools,
		instructions: baseInstructions,
	};
}

export function createWriterAgent(contentType: ContentType) {
	const contentInstructions = writerInstructions[contentType];
	const { tools, instructions: toolInstructions } =
		getToolsForContentType(contentType);
	const agentId = `${contentType}-writer`;
	const agentName = `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Writer`;

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

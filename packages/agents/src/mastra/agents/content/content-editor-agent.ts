import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import { createToolSystemPrompt } from "../../helpers";
import { dateTool, getDateToolInstructions } from "../../tools/date-tool";
import { articleEditorInstructions } from "./instructions/article";
import { changelogEditorInstructions } from "./instructions/changelog";
import { tutorialEditorInstructions } from "./instructions/tutorial";

const openrouter = createOpenRouter({
	apiKey: serverEnv.OPENROUTER_API_KEY,
});

export type ContentType = "article" | "changelog" | "tutorial";

const editorInstructions: Record<ContentType, string> = {
	article: articleEditorInstructions,
	changelog: changelogEditorInstructions,
	tutorial: tutorialEditorInstructions,
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
	return `You MUST provide all ${contentTypeLabels[contentType]} editing output in ${languageNames[language]}.`;
}

export function createEditorAgent(contentType: ContentType) {
	const contentInstructions = editorInstructions[contentType];
	const agentId = `${contentType}-editor`;
	const agentName = `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Editor`;

	return new Agent({
		id: agentId,
		instructions: ({ requestContext }) => {
			const locale = requestContext.get("language") as "en" | "pt";
			return `${contentInstructions}

${getLanguageInstruction(locale ?? "en", contentType)}

${createToolSystemPrompt([getDateToolInstructions()])}`;
		},
		model: openrouter("x-ai/grok-4-fast"),
		name: agentName,
		tools: { dateTool },
	});
}

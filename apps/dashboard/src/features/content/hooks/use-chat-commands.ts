import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
	MessageSquare,
	ListTodo,
	Sparkles,
	Wand2,
	Expand,
	FileText,
	SpellCheck,
	Trash2,
	FileCode,
	TextSelect,
	Tags,
	Type,
} from "lucide-react";
import {
	setChatMode,
	clearChat,
	useChatState,
} from "../context/chat-context";

export interface ChatCommand {
	id: string;
	label: string;
	description: string;
	icon: LucideIcon;
	shortcut?: string;
	category: "mode" | "action" | "context";
}

export interface SlashCommand extends ChatCommand {
	handler: () => void;
}

export interface MentionCommand extends ChatCommand {
	getValue: () => string;
}

export interface CommandContext {
	documentContent: string;
	selectionContext: { text: string } | null;
	contentMetadata: {
		title: string;
		keywords?: string[];
	} | null;
}

interface UseChatCommandsResult {
	slashCommands: SlashCommand[];
	mentionCommands: MentionCommand[];
	filterCommands: <T extends ChatCommand>(
		commands: T[],
		query: string,
	) => T[];
}

export function useChatCommands(
	onSendMessage?: (message: string) => void,
): UseChatCommandsResult {
	const { documentContent, selectionContext, contentMetadata } = useChatState();

	const slashCommands = useMemo<SlashCommand[]>(
		() => [
			// Mode commands
			{
				id: "chat",
				label: "chat",
				description: "Switch to chat mode",
				icon: MessageSquare,
				category: "mode",
				handler: () => setChatMode("chat"),
			},
			{
				id: "plan",
				label: "plan",
				description: "Switch to plan mode",
				icon: ListTodo,
				category: "mode",
				handler: () => setChatMode("plan"),
			},
			{
				id: "agent",
				label: "agent",
				description: "Switch to agent mode with edits",
				icon: Sparkles,
				category: "mode",
				handler: () => setChatMode("agent"),
			},
			// Action commands
			{
				id: "improve",
				label: "improve",
				description: "Improve the writing quality",
				icon: Wand2,
				category: "action",
				handler: () => {
					const text = selectionContext?.text || "the content";
					onSendMessage?.(`Improve ${text}`);
				},
			},
			{
				id: "expand",
				label: "expand",
				description: "Expand and add more detail",
				icon: Expand,
				category: "action",
				handler: () => {
					const text = selectionContext?.text || "the content";
					onSendMessage?.(`Expand and add more detail to ${text}`);
				},
			},
			{
				id: "summarize",
				label: "summarize",
				description: "Create a summary",
				icon: FileText,
				category: "action",
				handler: () => {
					onSendMessage?.("Summarize this content");
				},
			},
			{
				id: "fix",
				label: "fix",
				description: "Fix grammar and spelling",
				icon: SpellCheck,
				category: "action",
				handler: () => {
					const text = selectionContext?.text || "the content";
					onSendMessage?.(`Fix grammar and spelling in ${text}`);
				},
			},
			{
				id: "clear",
				label: "clear",
				description: "Clear the conversation",
				icon: Trash2,
				category: "action",
				handler: () => clearChat(),
			},
		],
		[selectionContext, onSendMessage],
	);

	const mentionCommands = useMemo<MentionCommand[]>(
		() => [
			{
				id: "document",
				label: "document",
				description: "Reference the full document",
				icon: FileCode,
				category: "context",
				getValue: () => {
					if (!documentContent) return "[No document content]";
					const preview =
						documentContent.length > 100
							? `${documentContent.slice(0, 100)}...`
							: documentContent;
					return `[Document: ${preview}]`;
				},
			},
			{
				id: "selection",
				label: "selection",
				description: "Reference current selection",
				icon: TextSelect,
				category: "context",
				getValue: () => {
					if (!selectionContext?.text) return "[No selection]";
					return `[Selection: ${selectionContext.text}]`;
				},
			},
			{
				id: "title",
				label: "title",
				description: "Reference content title",
				icon: Type,
				category: "context",
				getValue: () => {
					if (!contentMetadata?.title) return "[No title]";
					return `[Title: ${contentMetadata.title}]`;
				},
			},
			{
				id: "keywords",
				label: "keywords",
				description: "Reference content keywords",
				icon: Tags,
				category: "context",
				getValue: () => {
					if (!contentMetadata?.keywords?.length) return "[No keywords]";
					return `[Keywords: ${contentMetadata.keywords.join(", ")}]`;
				},
			},
		],
		[documentContent, selectionContext, contentMetadata],
	);

	const filterCommands = useMemo(
		() =>
			<T extends ChatCommand>(commands: T[], query: string): T[] => {
				if (!query) return commands;
				const lowerQuery = query.toLowerCase();
				return commands.filter(
					(cmd) =>
						cmd.label.toLowerCase().includes(lowerQuery) ||
						cmd.description.toLowerCase().includes(lowerQuery),
				);
			},
		[],
	);

	return {
		slashCommands,
		mentionCommands,
		filterCommands,
	};
}

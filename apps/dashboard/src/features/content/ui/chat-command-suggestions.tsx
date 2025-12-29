import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandEmpty,
} from "@packages/ui/components/command";
import { cn } from "@packages/ui/lib/utils";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type {
	SlashCommand,
	MentionCommand,
	ChatCommand,
} from "../hooks/use-chat-commands";

interface ChatCommandSuggestionsProps {
	type: "slash" | "mention";
	slashCommands: SlashCommand[];
	mentionCommands: MentionCommand[];
	query: string;
	onSelect: (command: ChatCommand) => void;
	filterCommands: <T extends ChatCommand>(commands: T[], query: string) => T[];
}

export interface ChatCommandSuggestionsRef {
	moveUp: () => void;
	moveDown: () => void;
	selectCurrent: () => void;
}

export const ChatCommandSuggestions = forwardRef<
	ChatCommandSuggestionsRef,
	ChatCommandSuggestionsProps
>(function ChatCommandSuggestions(
	{
		type,
		slashCommands,
		mentionCommands,
		query,
		onSelect,
		filterCommands,
	},
	ref,
) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Get filtered commands based on type
	const commands: ChatCommand[] =
		type === "slash"
			? filterCommands(slashCommands, query)
			: filterCommands(mentionCommands, query);

	// Group commands by category
	const groupedCommands = commands.reduce(
		(acc, cmd) => {
			const category = cmd.category;
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(cmd);
			return acc;
		},
		{} as Record<string, ChatCommand[]>,
	);

	// Flatten for index tracking
	const flatCommands = Object.values(groupedCommands).flat();

	// Reset selection when commands change
	useEffect(() => {
		setSelectedIndex(0);
	}, [query, type]);

	// Expose keyboard navigation methods
	useImperativeHandle(ref, () => ({
		moveUp: () => {
			setSelectedIndex((i) => (i > 0 ? i - 1 : flatCommands.length - 1));
		},
		moveDown: () => {
			setSelectedIndex((i) => (i < flatCommands.length - 1 ? i + 1 : 0));
		},
		selectCurrent: () => {
			const selected = flatCommands[selectedIndex];
			if (selected) {
				onSelect(selected);
			}
		},
	}));

	if (flatCommands.length === 0) {
		return (
			<div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover p-2 shadow-md">
				<p className="text-sm text-muted-foreground text-center py-2">
					No commands found
				</p>
			</div>
		);
	}

	const categoryLabels: Record<string, string> = {
		mode: "Modes",
		action: "Actions",
		context: "Context",
	};

	let currentIndex = 0;

	return (
		<div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover shadow-md overflow-hidden max-h-64 overflow-y-auto">
			<Command className="rounded-none border-0">
				<CommandList>
					<CommandEmpty>No commands found</CommandEmpty>

					{Object.entries(groupedCommands).map(([category, cmds]) => (
						<CommandGroup key={category} heading={categoryLabels[category] || category}>
							{cmds.map((cmd) => {
								const itemIndex = currentIndex++;
								const isSelected = itemIndex === selectedIndex;
								const Icon = cmd.icon;

								return (
									<CommandItem
										key={cmd.id}
										value={cmd.id}
										onSelect={() => onSelect(cmd)}
										className={cn(
											"flex items-center gap-2 cursor-pointer",
											isSelected && "bg-accent",
										)}
									>
										<Icon className="size-4 text-muted-foreground" />
										<div className="flex-1 min-w-0">
											<span className="font-medium">
												{type === "slash" ? "/" : "@"}
												{cmd.label}
											</span>
											<p className="text-xs text-muted-foreground truncate">
												{cmd.description}
											</p>
										</div>
									</CommandItem>
								);
							})}
						</CommandGroup>
					))}
				</CommandList>
			</Command>
		</div>
	);
});

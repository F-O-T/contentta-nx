import {
	ToggleGroup,
	ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { MessageSquare, ListTodo, Sparkles } from "lucide-react";
import { type ChatMode, setChatMode, useChatState } from "../context/chat-context";

const modes: Array<{
	value: ChatMode;
	label: string;
	icon: typeof MessageSquare;
}> = [
	{ value: "chat", label: "Chat", icon: MessageSquare },
	{ value: "plan", label: "Plan", icon: ListTodo },
	{ value: "agent", label: "Agent", icon: Sparkles },
];

export function ChatModeToggle() {
	const { mode } = useChatState();

	return (
		<ToggleGroup
			type="single"
			value={mode}
			onValueChange={(value) => {
				if (value) {
					setChatMode(value as ChatMode);
				}
			}}
			variant="outline"
			size="sm"
			className="w-full"
		>
			{modes.map(({ value, label, icon: Icon }) => (
				<ToggleGroupItem
					key={value}
					value={value}
					className="flex-1 gap-1.5 text-xs"
					aria-label={`Switch to ${label} mode`}
				>
					<Icon className="size-3.5" />
					{label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

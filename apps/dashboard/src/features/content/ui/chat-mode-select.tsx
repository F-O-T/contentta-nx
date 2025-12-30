import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { ListChecks, Pencil } from "lucide-react";
import {
	type ChatMode,
	setChatMode,
	useChatState,
} from "../context/chat-context";

const modes = [
	{
		value: "plan" as const,
		label: "Plan",
		icon: ListChecks,
		description: "Research & create plans",
	},
	{
		value: "writer" as const,
		label: "Writer",
		icon: Pencil,
		description: "Direct editing mode",
	},
] as const;

const defaultMode = modes[0];

export function ChatModeSelect() {
	const { mode } = useChatState();
	const currentMode = modes.find((m) => m.value === mode) ?? defaultMode;
	const CurrentIcon = currentMode.icon;

	return (
		<Select
			value={mode}
			onValueChange={(value) => {
				if (value) {
					setChatMode(value as ChatMode);
				}
			}}
		>
			<SelectTrigger size="sm" className="h-7 gap-1.5 text-xs">
				<SelectValue>
					<CurrentIcon className="size-3.5" />
					{currentMode.label}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{modes.map(({ value, label, icon: Icon, description }) => (
					<SelectItem key={value} value={value} className="flex-col items-start">
						<div className="flex items-center gap-1.5">
							<Icon className="size-3.5" />
							<span>{label}</span>
						</div>
						<span className="text-[10px] text-muted-foreground">
							{description}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

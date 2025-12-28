import { translate } from "@packages/localization";
import { Avatar, AvatarFallback, AvatarImage } from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import type { MobileCardRenderProps } from "@packages/ui/components/data-table";
import { Link } from "@tanstack/react-router";
import { Archive, Edit, Eye, MoreVertical, Send, Trash2 } from "lucide-react";
import type { ContentItem } from "./content-table-columns";

const STATUS_COLORS: Record<string, string> = {
	archived: "bg-slate-500/10 text-slate-600 border-slate-200",
	draft: "bg-amber-500/10 text-amber-600 border-amber-200",
	published: "bg-green-500/10 text-green-600 border-green-200",
};

type ContentMobileCardProps = MobileCardRenderProps<ContentItem> & {
	slug: string;
	onEdit?: (content: ContentItem) => void;
	onDelete?: (content: ContentItem) => void;
	onPublish?: (content: ContentItem) => void;
	onArchive?: (content: ContentItem) => void;
};

export function ContentMobileCard({
	row,
	slug,
	onEdit,
	onDelete,
	onPublish,
	onArchive,
}: ContentMobileCardProps) {
	const content = row.original;
	const agent = content.agent;

	const initials = agent?.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="flex items-start gap-3 p-4">
			<Checkbox
				aria-label="Select row"
				checked={row.getIsSelected()}
				className="mt-1"
				onCheckedChange={(value) => row.toggleSelected(!!value)}
			/>

			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<Link
							className="font-medium hover:underline truncate block"
							to="/$slug/content/$contentId"
							params={{ slug, contentId: content.id }}
						>
							{content.meta.title || translate("common.labels.untitled")}
						</Link>
						<p className="text-sm text-muted-foreground truncate">
							{content.meta.description}
						</p>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="size-8 p-0 shrink-0" variant="ghost">
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link
									to="/$slug/content/$contentId"
									params={{ slug, contentId: content.id }}
								>
									<Eye className="mr-2 size-4" />
									{translate("common.actions.view")}
								</Link>
							</DropdownMenuItem>
							{onEdit && (
								<DropdownMenuItem onClick={() => onEdit(content)}>
									<Edit className="mr-2 size-4" />
									{translate("common.actions.edit")}
								</DropdownMenuItem>
							)}
							{onPublish && content.status === "draft" && (
								<DropdownMenuItem onClick={() => onPublish(content)}>
									<Send className="mr-2 size-4" />
									{translate("common.actions.publish")}
								</DropdownMenuItem>
							)}
							{onArchive && content.status !== "archived" && (
								<DropdownMenuItem onClick={() => onArchive(content)}>
									<Archive className="mr-2 size-4" />
									{translate("common.actions.archive")}
								</DropdownMenuItem>
							)}
							{onDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => onDelete(content)}
									>
										<Trash2 className="mr-2 size-4" />
										{translate("common.actions.delete")}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex items-center gap-2 mt-2">
					<Badge className={STATUS_COLORS[content.status]} variant="outline">
						{translate(`common.status.${content.status}`)}
					</Badge>
					{agent && (
						<div className="flex items-center gap-1">
							<Avatar className="size-4">
								<AvatarImage alt={agent.name} src={agent.profilePhotoUrl ?? undefined} />
								<AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
							</Avatar>
							<span className="text-xs text-muted-foreground">{agent.name}</span>
						</div>
					)}
				</div>

				<p className="text-xs text-muted-foreground mt-2">
					{new Date(content.createdAt).toLocaleDateString()}
				</p>
			</div>
		</div>
	);
}

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
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Archive, Edit, Eye, MoreHorizontal, Send, Trash2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
	archived: "bg-slate-500/10 text-slate-600 border-slate-200",
	draft: "bg-amber-500/10 text-amber-600 border-amber-200",
	published: "bg-green-500/10 text-green-600 border-green-200",
};

export type ContentItem = {
	id: string;
	agentId: string;
	meta: {
		title: string;
		description: string;
		slug: string;
	};
	status: "draft" | "published" | "archived";
	createdAt: string;
	agent?: {
		id: string;
		name: string;
		profilePhotoUrl?: string | null;
	};
};

export function createContentColumns(
	slug: string,
	onEdit?: (content: ContentItem) => void,
	onDelete?: (content: ContentItem) => void,
	onPublish?: (content: ContentItem) => void,
	onArchive?: (content: ContentItem) => void,
): ColumnDef<ContentItem>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					aria-label="Select all"
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					aria-label="Select row"
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "title",
			header: translate("dashboard.routes.content.table.title"),
			cell: ({ row }) => {
				const content = row.original;

				return (
					<div className="min-w-0">
						<Link
							className="font-medium hover:underline truncate block max-w-[250px]"
							to="/$slug/content/$contentId"
							params={{ slug, contentId: content.id }}
						>
							{content.meta.title || translate("common.labels.untitled")}
						</Link>
						<p className="text-xs text-muted-foreground truncate max-w-[250px]">
							{content.meta.description}
						</p>
					</div>
				);
			},
		},
		{
			accessorKey: "agent",
			header: translate("dashboard.routes.content.table.writer"),
			cell: ({ row }) => {
				const agent = row.original.agent;
				if (!agent) return <span className="text-muted-foreground">-</span>;

				const initials = agent.name
					.split(" ")
					.map((n) => n[0])
					.join("")
					.toUpperCase()
					.slice(0, 2);

				return (
					<div className="flex items-center gap-2">
						<Avatar className="size-6">
							<AvatarImage alt={agent.name} src={agent.profilePhotoUrl ?? undefined} />
							<AvatarFallback className="text-xs">{initials}</AvatarFallback>
						</Avatar>
						<Link
							className="text-sm hover:underline truncate"
							to="/$slug/writers/$writerId"
							params={{ slug, writerId: agent.id }}
						>
							{agent.name}
						</Link>
					</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: translate("dashboard.routes.content.table.status"),
			cell: ({ row }) => (
				<Badge
					className={STATUS_COLORS[row.original.status]}
					variant="outline"
				>
					{translate(`common.status.${row.original.status}`)}
				</Badge>
			),
		},
		{
			accessorKey: "createdAt",
			header: translate("dashboard.routes.content.table.created"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{new Date(row.original.createdAt).toLocaleDateString()}
				</span>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const content = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="size-8 p-0" variant="ghost">
								<span className="sr-only">
									{translate("common.actions.open-menu")}
								</span>
								<MoreHorizontal className="size-4" />
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
				);
			},
		},
	];
}

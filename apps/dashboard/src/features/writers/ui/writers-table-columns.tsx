import { translate } from "@packages/localization";
import { Avatar, AvatarFallback, AvatarImage } from "@packages/ui/components/avatar";
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
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";

export type Writer = {
	id: string;
	personaConfig: {
		metadata: {
			name: string;
			description?: string;
		};
		instructions?: {
			writingGuidelines?: string;
			audienceProfile?: string;
			tone?: string;
			style?: string;
		};
	};
	profilePhotoUrl?: string | null;
	contentCount: number;
	lastGeneratedAt?: Date | string | null;
	createdAt: Date | string;
};

export function createWriterColumns(
	slug: string,
	onEdit?: (writer: Writer) => void,
	onDelete?: (writer: Writer) => void,
): ColumnDef<Writer>[] {
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
			accessorKey: "name",
			header: translate("dashboard.routes.writers.table.name"),
			cell: ({ row }) => {
				const writer = row.original;
				const name = writer.personaConfig.metadata.name;
				const initials = name
					.split(" ")
					.map((n) => n[0])
					.join("")
					.toUpperCase()
					.slice(0, 2);

				return (
					<div className="flex items-center gap-3">
						<Avatar className="size-8">
							<AvatarImage
								alt={name}
								src={writer.profilePhotoUrl ?? undefined}
							/>
							<AvatarFallback className="text-xs">{initials}</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<Link
								className="font-medium hover:underline truncate block"
								to="/$slug/writers/$writerId"
								params={{ slug, writerId: writer.id }}
							>
								{name}
							</Link>
							{writer.personaConfig.metadata.description && (
								<p className="text-xs text-muted-foreground truncate max-w-[200px]">
									{writer.personaConfig.metadata.description}
								</p>
							)}
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "contentCount",
			header: translate("dashboard.routes.writers.table.content-count"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.contentCount}
				</span>
			),
		},
		{
			accessorKey: "tone",
			header: translate("dashboard.routes.writers.table.tone"),
			cell: ({ row }) => (
				<span className="text-muted-foreground truncate max-w-[150px] block">
					{row.original.personaConfig.instructions?.tone || "-"}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: translate("dashboard.routes.writers.table.created"),
			cell: ({ row }) => {
				const date = row.original.createdAt instanceof Date ? row.original.createdAt : new Date(row.original.createdAt);
				return (
					<span className="text-muted-foreground">
						{date.toLocaleDateString()}
					</span>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const writer = row.original;

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
									to="/$slug/writers/$writerId"
									params={{ slug, writerId: writer.id }}
								>
									<Eye className="mr-2 size-4" />
									{translate("common.actions.view")}
								</Link>
							</DropdownMenuItem>
							{onEdit && (
								<DropdownMenuItem onClick={() => onEdit(writer)}>
									<Edit className="mr-2 size-4" />
									{translate("common.actions.edit")}
								</DropdownMenuItem>
							)}
							{onDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => onDelete(writer)}
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

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
import { Edit, Eye, FileText, MoreVertical, Trash2 } from "lucide-react";
import type { Writer } from "./writers-table-columns";

type WritersMobileCardProps = MobileCardRenderProps<Writer> & {
	slug: string;
	onEdit?: (writer: Writer) => void;
	onDelete?: (writer: Writer) => void;
};

export function WritersMobileCard({
	row,
	slug,
	onEdit,
	onDelete,
}: WritersMobileCardProps) {
	const writer = row.original;
	const name = writer.personaConfig.metadata.name;
	const initials = name
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

			<Avatar className="size-10 shrink-0">
				<AvatarImage alt={name} src={writer.profilePhotoUrl ?? undefined} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>

			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<Link
							className="font-medium hover:underline truncate block"
							to="/$slug/writers/$writerId"
							params={{ slug, writerId: writer.id }}
						>
							{name}
						</Link>
						{writer.personaConfig.metadata.description && (
							<p className="text-sm text-muted-foreground truncate">
								{writer.personaConfig.metadata.description}
							</p>
						)}
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
				</div>

				<div className="flex items-center gap-2 mt-2">
					<Badge className="gap-1" variant="secondary">
						<FileText className="size-3" />
						{writer.contentCount} {translate("dashboard.routes.writers.table.contents")}
					</Badge>
					{writer.personaConfig.instructions?.tone && (
						<Badge variant="outline">
							{writer.personaConfig.instructions.tone}
						</Badge>
					)}
				</div>

				<p className="text-xs text-muted-foreground mt-2">
					{translate("dashboard.routes.writers.table.created")}:{" "}
					{new Date(writer.createdAt).toLocaleDateString()}
				</p>
			</div>
		</div>
	);
}

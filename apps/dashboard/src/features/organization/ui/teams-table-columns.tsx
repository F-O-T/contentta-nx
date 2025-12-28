import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDate } from "@packages/utils/date";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, MoreVertical, Trash2, Users } from "lucide-react";

export type Team = RouterOutput["organizationTeams"]["listTeams"][number];

interface TeamActionsProps {
   team: Team;
   slug: string;
   onEdit?: (team: Team) => void;
   onDelete?: (team: Team) => void;
}

function TeamActionsCell({ team, slug, onEdit, onDelete }: TeamActionsProps) {
   return (
      <div className="flex justify-end">
         <DropdownMenu>
            <Tooltip>
               <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost">
                        <MoreVertical className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
               </TooltipTrigger>
               <TooltipContent>
                  {translate(
                     "dashboard.routes.organization.teams-table.columns.actions",
                  )}
               </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
               <DropdownMenuItem asChild>
                  <Link
                     params={{ slug, teamId: team.id }}
                     to="/$slug/organization/teams/$teamId"
                  >
                     <Eye className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.organization.teams-table.actions.view",
                     )}
                  </Link>
               </DropdownMenuItem>
               {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(team)}>
                     <Edit className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.organization.teams-table.actions.edit",
                     )}
                  </DropdownMenuItem>
               )}
               {onDelete && (
                  <>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(team)}
                     >
                        <Trash2 className="size-4 mr-2" />
                        {translate(
                           "dashboard.routes.organization.teams-table.actions.delete",
                        )}
                     </DropdownMenuItem>
                  </>
               )}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}

export function createTeamColumns(
   slug: string,
   onEdit?: (team: Team) => void,
   onDelete?: (team: Team) => void,
): ColumnDef<Team>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const team = row.original;
            return (
               <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md border bg-muted">
                     <Users className="size-4" />
                  </div>
                  <span className="font-medium">{team.name}</span>
               </div>
            );
         },
         enableSorting: false,
         header: translate(
            "dashboard.routes.organization.teams-table.columns.name",
         ),
      },
      {
         accessorKey: "description",
         cell: ({ row }) => {
            const description = row.original.description;
            return (
               <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
                  {description || "-"}
               </span>
            );
         },
         enableSorting: false,
         header: translate(
            "dashboard.routes.organization.teams-table.columns.description",
         ),
      },
      {
         accessorKey: "createdAt",
         cell: ({ row }) => {
            const date = row.original.createdAt;
            return (
               <span className="text-muted-foreground text-sm">
                  {formatDate(new Date(date), "DD MMM YYYY")}
               </span>
            );
         },
         enableSorting: false,
         header: translate(
            "dashboard.routes.organization.teams-table.columns.created",
         ),
      },
      {
         cell: ({ row }) => (
            <TeamActionsCell
               onDelete={onDelete}
               onEdit={onEdit}
               slug={slug}
               team={row.original}
            />
         ),
         enableSorting: false,
         header: "",
         id: "actions",
      },
   ];
}

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import { CollapsibleTrigger } from "@packages/ui/components/collapsible";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { formatDate } from "@packages/utils/date";
import type { Row } from "@tanstack/react-table";
import { ChevronDown, MoreVertical, Shield, Trash2 } from "lucide-react";
import { MemberAvatarCell } from "@/features/organization/ui/shared/member-avatar-cell";
import { RoleBadge } from "@/features/organization/ui/shared/role-badge";
import type { Member } from "./members-table-columns";

type MembersMobileCardProps = {
   row: Row<Member>;
   isExpanded: boolean;
   toggleExpanded: () => void;
   canExpand?: boolean;
   onChangeRole?: (member: Member) => void;
   onRemove?: (member: Member) => void;
};

export function MembersMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   canExpand = true,
   onChangeRole,
   onRemove,
}: MembersMobileCardProps) {
   const member = row.original;
   const isOwner = member.role.toLowerCase() === "owner";

   return (
      <Card className={isExpanded ? "rounded-b-none py-4" : "py-4"}>
         <CardHeader className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
               <CardTitle className="text-sm">
                  <MemberAvatarCell
                     email={member.user.email}
                     image={member.user.image}
                     name={member.user.name}
                     showEmail
                  />
               </CardTitle>
               <CardDescription className="mt-1">
                  {translate(
                     "dashboard.routes.organization.members-table.columns.joined",
                  )}
                  : {formatDate(new Date(member.createdAt), "DD MMM YYYY")}
               </CardDescription>
            </div>
            <CardAction>
               <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
               />
            </CardAction>
         </CardHeader>
         <CardContent className="flex flex-wrap items-center gap-2">
            <RoleBadge role={member.role} />
         </CardContent>
         {canExpand && (
            <CardFooter className="flex gap-2">
               {!isOwner && (onChangeRole || onRemove) && (
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline">
                           <MoreVertical className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start">
                        {onChangeRole && (
                           <DropdownMenuItem
                              onClick={() => onChangeRole(member)}
                           >
                              <Shield className="size-4 mr-2" />
                              {translate(
                                 "dashboard.routes.organization.members-table.actions.change-role",
                              )}
                           </DropdownMenuItem>
                        )}
                        {onRemove && (
                           <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                 className="text-destructive"
                                 onClick={() => onRemove(member)}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 {translate(
                                    "dashboard.routes.organization.members-table.actions.remove",
                                 )}
                              </DropdownMenuItem>
                           </>
                        )}
                     </DropdownMenuContent>
                  </DropdownMenu>
               )}
               <CollapsibleTrigger asChild onClick={toggleExpanded}>
                  <Button className="flex-1" variant="outline">
                     <ChevronDown
                        className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                     />
                     {translate("common.actions.more")}
                  </Button>
               </CollapsibleTrigger>
            </CardFooter>
         )}
      </Card>
   );
}

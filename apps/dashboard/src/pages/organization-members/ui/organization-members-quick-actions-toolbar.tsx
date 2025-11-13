import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { InviteMemberSheet } from "../features/invite-member-sheet";

export function MembersQuickActionsToolbar() {
   const [isInviteMemberSheetOpen, setIsInviteMemberSheetOpen] = useState(false);

   const quickActions = [
      {
         icon: <Plus className="size-4" />,
         label: "Invite New Member",
         onClick: () => setIsInviteMemberSheetOpen(true),
         variant: "default" as const,
      },
   ];

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>Member Actions</ItemTitle>
               <ItemDescription>Manage organization members</ItemDescription>
            </ItemContent>
            <ItemActions>
               <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                     <Tooltip key={`member-action-${index + 1}`}>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={action.onClick}
                              size="icon"
                              variant={action.variant}
                           >
                              {action.icon}
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{action.label}</p>
                        </TooltipContent>
                     </Tooltip>
                  ))}
               </div>
            </ItemActions>
         </Item>

         <InviteMemberSheet
            onOpenChange={setIsInviteMemberSheetOpen}
            open={isInviteMemberSheetOpen}
         />
      </>
   );
}
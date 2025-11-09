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
import { MailPlus, RefreshCw, UserPlus } from "lucide-react";
import { useState } from "react";
import { SendInvitationSheet } from "@/features/organization-actions/ui/send-invitation-sheet";

export function MembersQuickActionsToolbar() {
   const [isInvitationSheetOpen, setIsInvitationSheetOpen] = useState(false);

   const quickActions = [
      {
         icon: <MailPlus className="size-4" />,
         label: "Invite Members",
         onClick: () => setIsInvitationSheetOpen(true),
         variant: "default" as const,
      },
      {
         icon: <RefreshCw className="size-4" />,
         label: "Refresh Members",
         onClick: () => window.location.reload(),
         variant: "outline" as const,
      },
   ];

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>Member Actions</ItemTitle>
               <ItemDescription>
                  Manage organization members and invitations
               </ItemDescription>
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

         <SendInvitationSheet
            onOpenChange={setIsInvitationSheetOpen}
            open={isInvitationSheetOpen}
         />
      </>
   );
}
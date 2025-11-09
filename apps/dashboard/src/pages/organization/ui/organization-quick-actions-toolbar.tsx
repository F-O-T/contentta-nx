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
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { SendInvitationSheet } from "@/features/organization-actions/ui/send-invitation-sheet";
import { DeleteOrganizationDialog } from "../features/delete-organization-dialog";
import { EditOrganizationSheet } from "../features/edit-organization-sheet";

export function QuickActionsToolbar() {
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
   const [isInvitationSheetOpen, setIsInvitationSheetOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

   const quickActions = [
      {
         icon: <Edit className="size-4" />,
         label: "Edit Organization",
         onClick: () => setIsEditSheetOpen(true),
         variant: "outline" as const,
      },
      {
         icon: <Plus className="size-4" />,
         label: "Add New Member",
         onClick: () => setIsInvitationSheetOpen(true),
         variant: "outline" as const,
      },
      {
         icon: <Trash2 className="size-4" />,
         label: "Delete Organization",
         onClick: () => setIsDeleteDialogOpen(true),
         variant: "destructive" as const,
      },
   ];

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>Actions Toolbar</ItemTitle>
               <ItemDescription>Common tasks and operations</ItemDescription>
            </ItemContent>
            <ItemActions>
               <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                     <Tooltip key={`quick-action-${index + 1}`}>
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

         <EditOrganizationSheet
            onOpenChange={setIsEditSheetOpen}
            open={isEditSheetOpen}
         />
         <SendInvitationSheet
            onOpenChange={setIsInvitationSheetOpen}
            open={isInvitationSheetOpen}
         />
         <DeleteOrganizationDialog
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
         />
      </>
   );
}

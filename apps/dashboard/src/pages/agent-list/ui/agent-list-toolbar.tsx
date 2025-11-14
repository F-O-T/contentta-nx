import { translate } from "@packages/localization";
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
import {
   CheckSquare,
   Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAgentList } from "../lib/agent-list-context";
import { AddAgentSheet } from "../lib/add-agent-sheet";

export function AgentListToolbar() {
   const [openSheet, setOpenSheet] = useState(false);
   const { handleSelectAll, allSelected } = useAgentList();

   const quickActions = useMemo(
      () => [
         {
            icon: <CheckSquare className="size-4" />,
            label: allSelected
               ? translate("pages.agent-list.toolbar.unselect-all")
               : translate("pages.agent-list.toolbar.select-all"),
            onClick: handleSelectAll,
            variant: "outline" as const,
         },
         {
            icon: <Plus className="size-4" />,
            label: translate("pages.agent-list.toolbar.create-new-agent"),
            onClick: () => setOpenSheet(true),
            variant: "default" as const,
         },
      ],
      [handleSelectAll, allSelected],
   );

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>Agent Actions</ItemTitle>
               <ItemDescription>Manage your AI agents</ItemDescription>
            </ItemContent>
            <ItemActions>
               <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                     <Tooltip key={`agent-action-${index + 1}`}>
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

         <AddAgentSheet open={openSheet} onOpenChange={setOpenSheet} />
      </>
   );
}

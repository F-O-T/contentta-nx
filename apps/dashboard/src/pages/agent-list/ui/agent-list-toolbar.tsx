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
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAgentList } from "../features/agent-list-context";
import { AddAgentSheet } from "../features/add-agent-sheet";
import { BulkDeleteConfirmationDialog } from "../features/bulk-delete-confirmation-dialog";
import { useTRPC } from "@/integrations/clients";

export function AgentListToolbar() {
   const [openSheet, setOpenSheet] = useState(false);
   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
   const {
      handleSelectAll,
      allSelected,
      selectedItems,
      selectedItemsCount,
      setSelectedItems,
   } = useAgentList();
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const { mutate: deleteAgent, isPending: isDeleting } = useMutation(
      trpc.agent.delete.mutationOptions({
         onError: () => {
            toast.error("Failed to delete agents");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
         },
      }),
   );

   const handleBulkDelete = () => {
      if (selectedItemsCount === 0) return;

      // Delete agents one by one since there's no bulk delete endpoint
      selectedItems.forEach((id) => {
         deleteAgent({ id });
      });

      setSelectedItems(new Set());
      setShowDeleteConfirmation(false);
      toast.success(
         `${selectedItemsCount} agent${selectedItemsCount > 1 ? "s" : ""} deleted successfully`,
      );
   };

   const quickActions = useMemo(
      () => [
         {
            icon: <Trash2 className="size-4" />,
            label:
               selectedItemsCount > 0
                  ? `Delete Selected (${selectedItemsCount})`
                  : "Delete Selected",
            onClick: () => {
               if (selectedItemsCount > 0) {
                  setShowDeleteConfirmation(true);
               }
            },
            variant: "destructive" as const,
            disabled: selectedItemsCount === 0,
         },

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
      [handleSelectAll, allSelected, selectedItemsCount],
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
                              disabled={action.disabled}
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
         <BulkDeleteConfirmationDialog
            open={showDeleteConfirmation}
            onOpenChange={setShowDeleteConfirmation}
            selectedItemsCount={selectedItemsCount}
            onConfirm={handleBulkDelete}
            isDeleting={isDeleting}
         />
      </>
   );
}

import type { RouterOutput } from "@packages/api/client";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink, RefreshCw, Trash } from "lucide-react";
import { useState } from "react";
import { createToast } from "@/features/error-modal/lib/create-toast";
import { useTRPC } from "@/integrations/clients";
import { CreateEditBrandDialog } from "../features/create-edit-brand-dialog";
import { DeleteBrandConfirmationDialog } from "../features/delete-brand-confirmation-dialog";

interface BrandDetailsActionsProps {
   brand: RouterOutput["brand"]["list"]["items"][number];
}

export function BrandDetailsActions({ brand }: BrandDetailsActionsProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);

   const analyzeMutation = useMutation(
      trpc.brand.analyze.mutationOptions({
         onError: (error) => {
            createToast({
               message: `Failed to start analysis: ${error.message ?? "Unknown error"}`,
               type: "danger",
            });
         },
         onSuccess: () => {
            createToast({
               message: "Brand analysis started",
               type: "success",
            });
            queryClient.invalidateQueries({
               queryKey: trpc.brand.getByOrganization.queryKey(),
            });
         },
      }),
   );

   const handleAnalyze = () => {
      analyzeMutation.mutate({ id: brand.id });
   };

   const handleVisitWebsite = () => {
      if (brand.websiteUrl) {
         window.open(brand.websiteUrl, "_blank", "noopener,noreferrer");
      }
   };

   const actions = [
      {
         disabled: !brand.websiteUrl,
         icon: ExternalLink,
         label: "Visit Website",
         onClick: handleVisitWebsite,
      },
      {
         disabled: analyzeMutation.isPending,
         icon: RefreshCw,
         label: analyzeMutation.isPending ? "Analyzing..." : "Refresh Analysis",
         onClick: handleAnalyze,
      },
      {
         disabled: false,
         icon: Edit,
         label: "Edit Brand",
         onClick: () => setShowEditDialog(true),
      },
      {
         disabled: false,
         icon: Trash,
         label: "Delete Brand",
         onClick: () => setShowDeleteDialog(true),
      },
   ];

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>Brand Actions</ItemTitle>
               <ItemDescription>
                  Quick actions to manage your brand and analysis
               </ItemDescription>
            </ItemContent>
            <ItemActions>
               <div className="flex flex-wrap gap-2">
                  {actions.map((action, index) => (
                     <Tooltip key={`brand-action-${index + 1}`}>
                        <TooltipTrigger asChild>
                           <Button
                              disabled={action.disabled}
                              onClick={action.onClick}
                              size="icon"
                              variant="outline"
                           >
                              <action.icon className="size-4" />
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

         <CreateEditBrandDialog
            brand={brand}
            onOpenChange={setShowEditDialog}
            open={showEditDialog}
         />

         <DeleteBrandConfirmationDialog
            brand={brand}
            onOpenChange={setShowDeleteDialog}
            open={showDeleteDialog}
         />
      </>
   );
}

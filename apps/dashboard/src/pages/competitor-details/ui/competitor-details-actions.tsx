import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
   CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import {
   ExternalLink,
   RefreshCw,
   Edit,
   Trash,
   Upload,
   Brain,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { createToast } from "@/features/error-modal/lib/create-toast";
import {
   Tooltip,
   TooltipTrigger,
   TooltipContent,
} from "@packages/ui/components/tooltip";
import { CreateEditCompetitorDialog } from "../../competitor-list/features/create-edit-competitor-dialog";
import { useState } from "react";
import { DeleteCompetitorConfirmationDialog } from "../../competitor-list/features/delete-competitor-confirmation-dialog";
import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";

interface CompetitorDetailsActionsProps {
   competitor: RouterOutput["competitor"]["list"]["items"][number];
   onLogoUpload?: () => void;
}

export function CompetitorDetailsActions({
   competitor,
   onLogoUpload,
}: CompetitorDetailsActionsProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);

   const analyzeMutation = useMutation(
      trpc.competitor.analyze.mutationOptions({
         onSuccess: () => {
            createToast({
               type: "success",
               message: translate(
                  "pages.competitor-details.messages.analysis-started",
               ),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.get.queryKey({ id: competitor.id }),
            });
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: translate(
                  "pages.competitor-details.messages.analysis-error",
                  {
                     error: error.message ?? "Unknown error",
                  },
               ),
            });
         },
      }),
   );

   const generateFindingsMutation = useMutation(
      trpc.competitor.generateInsights.mutationOptions({
         onSuccess: () => {
            createToast({
               type: "success",
               message: "Findings generation started!",
            });
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.get.queryKey({ id: competitor.id }),
            });
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: `Error generating findings: ${error.message ?? "Unknown error"}`,
            });
         },
      }),
   );

   const handleAnalyze = () => {
      analyzeMutation.mutate({ id: competitor.id });
   };

   const handleGenerateFindings = () => {
      generateFindingsMutation.mutate({ competitorId: competitor.id });
   };

   const handleVisitWebsite = () => {
      window.open(competitor.websiteUrl, "_blank", "noopener,noreferrer");
   };

   const actions = [
      {
         icon: ExternalLink,
         label: translate(
            "pages.competitor-details.actions.buttons.visit-website",
         ),
         onClick: handleVisitWebsite,
         disabled: false,
      },
      {
         icon: RefreshCw,
         label: analyzeMutation.isPending
            ? translate("pages.competitor-details.actions.buttons.analyzing")
            : translate(
                 "pages.competitor-details.actions.buttons.refresh-analysis",
              ),
         onClick: handleAnalyze,
         disabled: analyzeMutation.isPending,
      },
      {
         icon: Brain,
         label: generateFindingsMutation.isPending
            ? "Generating..."
            : "Generate Findings",
         onClick: handleGenerateFindings,
         disabled: generateFindingsMutation.isPending,
      },
      {
         icon: Upload,
         label: translate(
            "pages.competitor-details.actions.buttons.upload-logo",
         ),
         onClick: onLogoUpload,
         disabled: !onLogoUpload,
      },
      {
         icon: Edit,
         label: translate(
            "pages.competitor-details.actions.buttons.edit-competitor",
         ),
         onClick: () => setShowEditDialog(true),
         disabled: false,
      },
      {
         icon: Trash,
         label: translate(
            "pages.competitor-details.actions.buttons.delete-competitor",
         ),
         onClick: () => setShowDeleteDialog(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.competitor-details.actions.card.title")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "pages.competitor-details.actions.card.description",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex items-center justify-center gap-2">
               {actions.map((action, index) => (
                  <Tooltip key={`competitor-action-${index + 1}`}>
                     <TooltipTrigger asChild>
                        <Button
                           size="icon"
                           variant="outline"
                           onClick={action.onClick}
                           disabled={action.disabled}
                        >
                           <action.icon />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>{action.label}</TooltipContent>
                  </Tooltip>
               ))}
            </CardContent>
         </Card>

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />

         <DeleteCompetitorConfirmationDialog
            competitor={competitor}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
         />
      </>
   );
}

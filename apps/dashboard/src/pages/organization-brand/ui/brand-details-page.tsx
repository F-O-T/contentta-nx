import { Button } from "@packages/ui/components/button";
import { Card, CardDescription, CardTitle } from "@packages/ui/components/card";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PendingComponent } from "@/default/pending";
import { createToast } from "@/features/error-modal/lib/create-toast";
import { useTRPC } from "@/integrations/clients";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { BrandFileViewerModal } from "../features/brand-file-viewer-modal";
import { CreateEditBrandDialog } from "../features/create-edit-brand-dialog";
import { BrandDetailsActions } from "./brand-details-actions";
import { BrandDetailsKnowledgeBaseCard } from "./brand-details-knowledge-base-card";
import { BrandFeaturesCard } from "./brand-features-card";
import { BrandStatsCard } from "./brand-stats-card";

export function BrandDetailsPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { data: brand, error: brandError } = useSuspenseQuery(
      trpc.brand.getByOrganization.queryOptions(),
   );
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const fileViewer = BrandFileViewerModal({ brandId: brand?.id || "" });

   const isGenerating = useMemo(
      () =>
         brand?.status &&
         ["pending", "analyzing", "chunking"].includes(brand.status),
      [brand?.status],
   );

   useSubscription(
      trpc.brand.onStatusChange.subscriptionOptions(
         {
            brandId: brand?.id || "",
         },
         {
            enabled: Boolean(brand && isGenerating),
            async onData(data) {
               createToast({
                  message: `Brand features status updated to: ${data.status}`,
                  type: "success",
               });
               await queryClient.invalidateQueries({
                  queryKey: trpc.brand.getByOrganization.queryKey(),
               });
            },
         },
      ),
   );

   if (!brand || brandError) {
      return (
         <main className="h-full w-full flex flex-col gap-4">
            <TalkingMascot message="Let's set up your brand to get started with content generation" />
            <Card className="flex flex-col items-center justify-center py-12">
               <div className="text-center max-w-md">
                  <CardTitle className="mb-2">No Brand Yet</CardTitle>
                  <CardDescription className="mb-6">
                     Create your brand profile to start generating personalized
                     content and managing your brand assets.
                  </CardDescription>
                  <Button
                     className="mb-4"
                     onClick={() => setShowCreateDialog(true)}
                     size="lg"
                  >
                     <Plus className="mr-2 h-4 w-4" />
                     Create Your First Brand
                  </Button>
                  <CreateEditBrandDialog
                     onOpenChange={setShowCreateDialog}
                     open={showCreateDialog}
                  />
               </div>
            </Card>
         </main>
      );
   }

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            {isGenerating ? (
               <PendingComponent message="Wait while we analyze your brand" />
            ) : (
               <>
                  <TalkingMascot message="Here you can manage your brand settings and analysis" />

                  <div className="grid md:grid-cols-3 gap-4">
                     <div className="col-span-1 md:col-span-2 grid gap-4">
                        <BrandDetailsActions brand={brand} />
                        <BrandFeaturesCard brandId={brand.id} />
                     </div>
                     <div className="col-span-1 gap-4 flex flex-col">
                        <BrandStatsCard brand={brand} />
                        <BrandDetailsKnowledgeBaseCard brand={brand} />
                     </div>
                  </div>
               </>
            )}
         </main>

         <CreateEditBrandDialog
            brand={brand}
            onOpenChange={setShowCreateDialog}
            open={showCreateDialog}
         />
         <fileViewer.Modal />
      </>
   );
}

import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Badge } from "@packages/ui/components/badge";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { translate } from "@packages/localization";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CompetitorDetailsActions } from "./competitor-details-actions";
import { CompetitorStatsCard } from "./competitor-stats-card";
import { CompetitorInfoCard } from "./competitor-info-card";
import { CreateEditCompetitorDialog } from "../../competitor-list/features/create-edit-competitor-dialog";
import { CompetitorFileViewerModal } from "../features/competitor-file-viewer-modal";
import { CompetitorLogoUploadDialog } from "../features/competitor-logo-upload-dialog";
import { useState, useMemo } from "react";
import { useSubscription } from "@trpc/tanstack-react-query";
import { createToast } from "@/features/error-modal/lib/create-toast";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
   CardAction,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
import { CompetitorFeaturesCard } from "./competitor-features-card";
import { CompetitorDetailsKnowledgeBaseCard } from "./competitor-details-knowledge-base-card";
import { PendingComponent } from "@/default/pending";

export function CompetitorDetailsPage() {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [showLogoUploadDialog, setShowLogoUploadDialog] = useState(false);
   const queryClient = useQueryClient();
   const fileViewer = CompetitorFileViewerModal();

   const { data: competitor } = useSuspenseQuery(
      trpc.competitor.get.queryOptions({ id }),
   );

   const { data: photo } = useSuspenseQuery(
      trpc.competitorFile.getLogo.queryOptions({ competitorId: id }),
   );
   // Calculate subscription enabled state using useMemo

   const isGenerating = useMemo(
      () =>
         competitor?.status &&
         ["pending", "analyzing", "chunking"].includes(
            competitor.status, // updated from competitor.analysisStatus to competitor.status
         ),
      [competitor?.status], // updated from competitor?.analysisStatus to competitor?.status
   );

   const findings = useMemo(() => {
      if (
         !competitor?.findings?.insights &&
         !competitor?.findings?.priorities
      ) {
         return { insights: [], priorities: [] };
      }
      const { insights, priorities } = competitor.findings;

      return {
         insights: insights || [],
         priorities: priorities || [],
      };
   }, [competitor?.findings]); // corrected dependency to use competitor?.findings
   useSubscription(
      trpc.competitor.onStatusChange.subscriptionOptions(
         {
            competitorId: id,
         },
         {
            async onData(data) {
               createToast({
                  type: "success",
                  message: translate(
                     "pages.competitor-details.messages.features-status-updated",
                     { status: data.status },
                  ),
               });
               await queryClient.invalidateQueries({
                  queryKey: trpc.competitor.get.queryKey({
                     id,
                  }),
               });
            },
            enabled: Boolean(isGenerating),
         },
      ),
   );

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            {isGenerating ? (
               <PendingComponent message="Wait while we search your competitor" />
            ) : (
               <>
                  <TalkingMascot
                     message={translate(
                        "pages.competitor-details.mascot-message",
                     )}
                  />

                  <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                     <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                        <CompetitorStatsCard />

                        <CompetitorFeaturesCard competitorId={competitor.id} />
                        <Card>
                           <CardHeader>
                              <CardTitle>Competitor Insights</CardTitle>
                              <CardDescription>
                                 Key insights and priorities from your
                                 competitor analysis.
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <div className="grid md:grid-cols-2 gap-4">
                                 <Card>
                                    <CardHeader>
                                       <CardTitle>Key Insights</CardTitle>
                                       <CardDescription>
                                          Important discoveries and patterns
                                          from competitor analysis
                                       </CardDescription>
                                       <CardAction>
                                          <Badge>
                                             {findings?.insights.length}
                                          </Badge>
                                       </CardAction>
                                    </CardHeader>
                                    <CardContent>
                                       <ScrollArea className="h-54">
                                          {findings.insights.length > 0 ? (
                                             <div className="space-y-3 pr-4">
                                                {findings?.insights.map(
                                                   (insight, index) => (
                                                      <Card
                                                         key={`insight-${index + 1}`}
                                                      >
                                                         <CardContent>
                                                            <Markdown
                                                               content={insight}
                                                            />
                                                         </CardContent>
                                                      </Card>
                                                   ),
                                                )}
                                             </div>
                                          ) : (
                                             <p className="text-sm text-gray-500 italic">
                                                No insights available
                                             </p>
                                          )}
                                       </ScrollArea>
                                    </CardContent>
                                 </Card>

                                 <Card>
                                    <CardHeader>
                                       <CardTitle>
                                          Recommended Priorities
                                       </CardTitle>
                                       <CardDescription>
                                          Action items and strategic
                                          recommendations based on findings
                                       </CardDescription>
                                       <CardAction>
                                          <Badge>
                                             {findings?.priorities?.length}
                                          </Badge>
                                       </CardAction>
                                    </CardHeader>
                                    <CardContent>
                                       <ScrollArea className="h-54">
                                          {findings?.priorities?.length > 0 ? (
                                             <div className="space-y-3 pr-4">
                                                {findings?.priorities.map(
                                                   (priority, index) => (
                                                      <Card
                                                         key={`priority-${index + 1}`}
                                                      >
                                                         <CardContent>
                                                            <Markdown
                                                               content={
                                                                  priority
                                                               }
                                                            />
                                                         </CardContent>
                                                      </Card>
                                                   ),
                                                )}
                                             </div>
                                          ) : (
                                             <p className="text-sm text-gray-500 italic">
                                                No priorities available
                                             </p>
                                          )}
                                       </ScrollArea>
                                    </CardContent>
                                 </Card>
                              </div>

                              {findings?.insights.length === 0 &&
                                 findings?.priorities.length === 0 && (
                                    <div className="text-center py-8 mt-4">
                                       <p className="text-sm text-muted-foreground">
                                          No insights available. Please add
                                          competitors and generate findings to
                                          get insights.
                                       </p>
                                    </div>
                                 )}
                           </CardContent>
                        </Card>
                     </div>

                     <div className="col-span-1 gap-4 flex flex-col">
                        <CompetitorDetailsActions
                           competitor={competitor}
                           onLogoUpload={() => setShowLogoUploadDialog(true)}
                        />

                        <CompetitorInfoCard competitor={competitor} />

                        <Card>
                           <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                 {translate(
                                    "pages.competitor-details.section.title",
                                 )}
                              </CardTitle>
                              <CardDescription>
                                 {translate(
                                    "pages.competitor-details.section.description",
                                 )}
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <Markdown content={competitor.summary ?? ""} />
                           </CardContent>
                        </Card>
                        <CompetitorDetailsKnowledgeBaseCard
                           competitor={competitor}
                        />
                     </div>
                  </div>
               </>
            )}
         </main>

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />
         <CompetitorLogoUploadDialog
            open={showLogoUploadDialog}
            onOpenChange={setShowLogoUploadDialog}
            currentLogo={photo?.data ?? ""}
         />
         <fileViewer.Modal />
      </>
   );
}

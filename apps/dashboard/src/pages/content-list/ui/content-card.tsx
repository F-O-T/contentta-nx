import { CardMultiStepLoader } from "@/widgets/multi-step-loader/ui/card-multi-step-loader";
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
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaTrigger,
   CredenzaBody,
} from "@packages/ui/components/credenza";
import { ContentDeleteConfirmationCredenza } from "../features/content-delete-confirmation-credenza";
import { Trash2, Eye, Lock, Globe } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@packages/ui/components/badge";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useTRPC } from "@/integrations/clients";
import {
   useSuspenseQuery,
   useMutation,
   useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { formatStringForDisplay } from "@packages/utils/text";
import { useContentList } from "../lib/content-list-context";
import { useSearch } from "@tanstack/react-router";
import { translate } from "@packages/localization";
import { useSubscription } from "@trpc/tanstack-react-query";

export function ContentRequestCard({
   request,
}: {
   request: RouterOutput["content"]["listAllContent"]["items"][0];
}) {
   const { selectedItems, handleSelectionChange } = useContentList();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const search = useSearch({ from: "/_dashboard/content/" });
   const { data: profilePhoto } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: request.agent?.id,
      }),
   );

   const isLoading = useMemo(() => {
      return request.status === "pending";
   }, [request.status]);

   const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);
   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {
            contentId: request.id,
         },
         {
            enabled: Boolean(isLoading),
            onData: ({ message, status }) => {
               toast.info(message || status);
            },
         },
      ),
   );
   const deleteMutation = useMutation(
      trpc.content.delete.mutationOptions({
         onSuccess: async () => {
            toast.success(
               translate("pages.content-list.messages.delete-success"),
            );
            setIsCredenzaOpen(false);
            // Invalidate queries to refresh the list
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(translate("pages.content-list.messages.delete-error"));
            console.error("Delete error:", error);
         },
      }),
   );

   const handleView = useCallback(() => {
      navigate({
         to: "/content/$id",
         params: { id: request.id },
         search,
      });
      setIsCredenzaOpen(false);
   }, [navigate, request.id, search]);

   const handleDelete = useCallback(() => {
      setShowDeleteConfirmation(true);
   }, []);

   const confirmDelete = useCallback(async () => {
      await deleteMutation.mutateAsync({ id: request.id });
      setShowDeleteConfirmation(false);
   }, [deleteMutation, request.id]);

   return (
      <>
         <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
            <CredenzaTrigger asChild>
               <Card className="cursor-pointer">
                  {isLoading ? (
                     <CardContent className="">
                        <CardMultiStepLoader
                           loading={isLoading}
                           loadingStates={[
                              {
                                 text: "Brewing creative ideas...",
                              },
                              {
                                 text: "Researching and analyzing...",
                              },
                              {
                                 text: "Crafting compelling content...",
                              },
                              {
                                 text: "Polishing and perfecting...",
                              },
                              {
                                 text: "Adding final touches...",
                              },
                           ]}
                        />
                     </CardContent>
                  ) : (
                     <>
                        <CardHeader>
                           <CardTitle className="line-clamp-1">
                              {request.meta?.title}
                           </CardTitle>
                           <CardDescription className="line-clamp-2">
                              {request.meta?.description ??
                                 translate(
                                    "pages.content-list.card.no-description",
                                 )}
                           </CardDescription>
                           <CardAction>
                              <Checkbox
                                 checked={selectedItems.has(request.id)}
                                 disabled={
                                    !["draft", "approved", "pending"].includes(
                                       request.status || "",
                                    )
                                 }
                                 onCheckedChange={(checked) =>
                                    handleSelectionChange(
                                       request.id,
                                       checked as boolean,
                                    )
                                 }
                                 onClick={(e) => e.stopPropagation()}
                              />
                           </CardAction>
                        </CardHeader>
                        <CardContent>
                           <AgentWriterCard
                              photo={profilePhoto?.data}
                              name={
                                 request.agent?.personaConfig.metadata.name ||
                                 translate(
                                    "pages.content-list.card.unknown-agent",
                                 )
                              }
                              description={
                                 request.agent?.personaConfig.metadata
                                    .description ||
                                 translate(
                                    "pages.content-list.card.no-agent-description",
                                 )
                              }
                           />
                        </CardContent>
                        <CardFooter className="flex items-center justify-between">
                           <Badge variant="outline">
                              {new Date(request.createdAt).toLocaleDateString()}
                           </Badge>
                           <div className="flex items-center gap-2">
                              <Badge className="text-xs">
                                 {formatStringForDisplay(request.status ?? "")}
                              </Badge>
                              {request.shareStatus === "shared" ? (
                                 <Globe className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                 <Lock className="w-4 h-4 text-muted-foreground" />
                              )}
                           </div>
                        </CardFooter>
                     </>
                  )}
               </Card>
            </CredenzaTrigger>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>
                     {request.meta?.title ||
                        translate("pages.content-list.card.untitled-content")}
                  </CredenzaTitle>
                  <CredenzaDescription>
                     {request.meta?.description ||
                        translate(
                           "pages.content-list.card.no-description-available",
                        )}
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaBody className="grid grid-cols-2 gap-2">
                  <SquaredIconButton onClick={handleView}>
                     <Eye className="h-4 w-4" />
                     {translate("pages.content-list.card.view-details")}
                  </SquaredIconButton>

                  <SquaredIconButton
                     destructive
                     onClick={handleDelete}
                     disabled={deleteMutation.isPending}
                  >
                     <Trash2 className="h-4 w-4" />
                     {deleteMutation.isPending
                        ? translate("common.actions.deleting")
                        : translate("pages.content-list.card.delete-content")}
                  </SquaredIconButton>
               </CredenzaBody>
            </CredenzaContent>
         </Credenza>
         <ContentDeleteConfirmationCredenza
            open={showDeleteConfirmation}
            onOpenChange={setShowDeleteConfirmation}
            contentTitle={
               request.meta?.title ||
               translate("pages.content-list.card.this-content")
            }
            onConfirm={confirmDelete}
         />
      </>
   );
}

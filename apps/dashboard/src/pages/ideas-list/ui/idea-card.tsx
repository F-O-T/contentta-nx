import { translate } from "@packages/localization";
import {
   Card,
   CardHeader,
   CardContent,
   CardFooter,
   CardTitle,
   CardAction,
   CardDescription,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { Checkbox } from "@packages/ui/components/checkbox";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaTrigger,
   CredenzaBody,
} from "@packages/ui/components/credenza";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { useIdeasList } from "../lib/ideas-list-context";
import { formatStringForDisplay } from "@packages/utils/text";
export function IdeaCard({
   idea,
}: {
   idea: RouterOutput["ideas"]["listAllIdeas"]["items"][number];
}) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: idea.agent.id,
      }),
   );

   const { selectedItems, handleSelectionChange } = useIdeasList();
   const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);
   const navigate = useNavigate();

   const handleViewDetails = () => {
      navigate({
         to: "/ideas/$id",
         params: { id: idea.id },
      });
      setIsCredenzaOpen(false);
   };

   const isGenerating =
      idea.status === "pending" &&
      (idea.content.title.includes("Generating") ||
         idea.content.description.includes("Generating"));

   return (
      <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
         <CredenzaTrigger asChild>
            <Card
               className={`cursor-pointer ${isGenerating ? "border-blue-500 bg-blue-50/50" : ""}`}
            >
               <CardHeader>
                  <CardTitle className="line-clamp-1 ">
                     {idea.content.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                     {idea.content.description}
                  </CardDescription>
                  <CardAction>
                     <Checkbox
                        checked={selectedItems.has(idea.id)}
                        disabled={idea.status !== "pending"}
                        onCheckedChange={(checked) =>
                           handleSelectionChange(idea.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                     />
                  </CardAction>
               </CardHeader>
               <CardContent className="flex flex-col gap-2">
                  <AgentWriterCard
                     photo={data?.data}
                     name={
                        idea.agent?.personaConfig.metadata.name ||
                        translate("pages.ideas-list.card.unknown-agent")
                     }
                     description={
                        idea.agent?.personaConfig.metadata.description ||
                        translate("pages.ideas-list.card.no-description")
                     }
                  />
               </CardContent>
               <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Badge variant="outline">
                        {idea.createdAt
                           ? new Date(idea.createdAt).toLocaleDateString()
                           : translate("pages.ideas-list.card.unknown-date")}
                     </Badge>
                  </div>
                  <Badge
                     className={`text-xs ${isGenerating ? "bg-blue-500" : ""}`}
                  >
                     {isGenerating
                        ? translate("pages.ideas-list.card.generating")
                        : formatStringForDisplay(idea.status ?? "")}
                  </Badge>
               </CardFooter>
            </Card>
         </CredenzaTrigger>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>{idea.content.title}</CredenzaTitle>
               <CredenzaDescription>
                  {idea.content.description}
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 gap-2">
               <SquaredIconButton onClick={handleViewDetails}>
                  <Eye className="h-4 w-4" />
                  {translate("pages.ideas-list.card.view-details")}
               </SquaredIconButton>
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}

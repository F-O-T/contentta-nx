import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardFooter,
} from "@packages/ui/components/card";
import { translate } from "@packages/localization";
import { FileText } from "lucide-react";
import { useMemo } from "react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { formatStringForDisplay } from "@packages/utils/text";
import type { RouterOutput } from "@packages/api/client";
type Agent = RouterOutput["agent"]["get"];
export const AgentPersonaCard = ({ agent }: { agent: Agent }) => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: agent?.id ?? "",
      }),
   );
   const items = useMemo(
      () => [
         {
            label: translate("pages.agent-details.persona.content-type"),
            value: formatStringForDisplay(agent?.personaConfig?.purpose ?? ""),
            icon: FileText,
         },
      ],
      [agent],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1">
               {translate("pages.agent-details.persona.title")}
            </CardTitle>
            <CardDescription className="line-clamp-1">
               {translate("pages.agent-details.persona.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-1 gap-4">
            {items.map(({ label, value, icon: Icon }) => (
               <InfoItem
                  key={label}
                  label={label}
                  value={value}
                  icon={<Icon className="w-4 h-4" />}
               />
            ))}
         </CardContent>
         <CardFooter className="grid gap-2">
            <Separator />
            <AgentWriterCard
               name={agent?.personaConfig?.metadata.name ?? ""}
               description={agent?.personaConfig?.metadata.description ?? ""}
               photo={data?.data}
            />
         </CardFooter>
      </Card>
   );
};

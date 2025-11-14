import { translate } from "@packages/localization";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentListProvider, useAgentList } from "../lib/agent-list-context";
import { AgentListToolbar } from "./agent-list-toolbar";
import { AgentListSection } from "./agent-list-section";
import { AgentStats } from "./agent-stats";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Bot } from "lucide-react";

function AgentListPageContent() {
   const trpc = useTRPC();
   const { page, limit } = useAgentList();
   const { data } = useSuspenseQuery(
      trpc.agent.list.queryOptions({ limit, page }),
   );

   const hasAgents = data?.items && data.items.length > 0;

   return (
      <main className="flex flex-col h-full w-full gap-4">
         <TalkingMascot
            message={translate("pages.agent-list.mascot-message")}
         />

         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 h-min md:col-span-2 grid gap-4">
               <AgentListToolbar />

               {hasAgents ? (
                  <AgentListSection />
               ) : (
                  <Card>
                     <CardContent className="p-6">
                        <Empty>
                           <EmptyHeader>
                              <EmptyMedia variant="icon">
                                 <Bot className="w-6 h-6" />
                              </EmptyMedia>
                              <EmptyTitle>No agents yet</EmptyTitle>
                              <EmptyDescription>
                                 Create your first AI agent to start generating
                                 content
                              </EmptyDescription>
                           </EmptyHeader>
                           <EmptyContent></EmptyContent>
                        </Empty>
                     </CardContent>
                  </Card>
               )}
            </div>
            <AgentStats />
         </div>
      </main>
   );
}

export function AgentListPage() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.agent.list.queryOptions({ limit: 8, page: 1 }),
   );

   return (
      <AgentListProvider data={data}>
         <AgentListPageContent />
      </AgentListProvider>
   );
}

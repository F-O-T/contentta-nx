import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bot, BotMessageSquare, Settings, Zap } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function AgentStatsContent() {
   const trpc = useTRPC();

   const { data: agentsData } = useSuspenseQuery(
      trpc.agent.list.queryOptions({ limit: 100, page: 1 }),
   );

   const stats = {
      total: agentsData.items.length,
      active: agentsData.items.filter((agent) => agent.isActive).length,
      configured: agentsData.items.filter((agent) => agent.isConfigured).length,
      published: agentsData.items.filter((agent) => agent.isPublished).length,
   };

   const statCards = [
      {
         description: "All created agents",
         icon: <Bot className="size-4" />,
         title: "Total Agents",
         value: stats.total,
         variant: "default" as const,
      },
      {
         description: "Currently active agents",
         icon: <Zap className="size-4" />,
         title: "Active Agents",
         value: stats.active,
         variant: "secondary" as const,
      },
      {
         description: "Fully configured agents",
         icon: <Settings className="size-4" />,
         title: "Configured",
         value: stats.configured,
         variant: "default" as const,
      },
      {
         description: "Published agents",
         icon: <BotMessageSquare className="size-4" />,
         title: "Published",
         value: stats.published,
         variant: "default" as const,
      },
   ];

   return (
      <div className="grid h-min grid-cols-2 gap-4">
         {statCards.map((stat) => (
            <StatsCard
               description={stat.description}
               key={stat.title}
               title={stat.title}
               value={stat.value}
            />
         ))}
      </div>
   );
}

function AgentStatsSkeleton() {
   return (
      <div className="grid h-min grid-cols-2 gap-4">
         {[1, 2, 3, 4].map((index) => (
            <Card
               className="col-span-1 h-full w-full"
               key={`agent-stats-skeleton-card-${index + 1}`}
            >
               <CardHeader>
                  <CardTitle>
                     <Skeleton className="h-6 w-24" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-4 w-32" />
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <Skeleton className="h-10 w-16" />
               </CardContent>
            </Card>
         ))}
      </div>
   );
}

function AgentStatsErrorFallback({ error }: { error: Error }) {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Agent Statistics</CardTitle>
            <CardDescription>Overview of all agent metrics</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4">
               <p className="text-sm text-muted-foreground">
                  Unable to load agent statistics
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
               </p>
            </div>
         </CardContent>
      </Card>
   );
}

export function AgentStats() {
   return (
      <ErrorBoundary FallbackComponent={AgentStatsErrorFallback}>
         <Suspense fallback={<AgentStatsSkeleton />}>
            <AgentStatsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
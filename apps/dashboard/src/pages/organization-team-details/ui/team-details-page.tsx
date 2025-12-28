import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { TeamActionButtons } from "./team-action-buttons";
import { TeamInfoCard } from "./team-info-card";
import { TeamMembersCard } from "./team-members-card";

function TeamDetailsContent() {
   const params = useParams({ strict: false });
   const teamId = (params as { teamId?: string }).teamId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const { data: team } = useSuspenseQuery(
      trpc.organizationTeams.getTeamById.queryOptions({ teamId }),
   );

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/organization/teams",
      });
   };

   if (!teamId) {
      return (
         <TeamDetailsPageError
            error={new Error("Invalid team ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!team) {
      return null;
   }

   return (
      <main className="space-y-6">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Button asChild className="size-8" size="icon" variant="outline">
                  <a
                     href={`/${activeOrganization.slug}/organization/teams`}
                     onClick={(e) => {
                        e.preventDefault();
                        router.navigate({
                           params: { slug: activeOrganization.slug },
                           to: "/$slug/organization/teams",
                        });
                     }}
                  >
                     <ArrowLeft className="size-4" />
                  </a>
               </Button>
               <div className="flex-1">
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-bold tracking-tight">
                        {team.name}
                     </h1>
                     <Badge
                        className="gap-1 border bg-blue-500/10 text-blue-600 border-blue-500/20"
                        variant="outline"
                     >
                        <Users className="size-3" />
                        {team.members?.length ?? 0} members
                     </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                     {team.description || "Team in your organization"}
                  </p>
               </div>
            </div>

            <TeamActionButtons
               onDeleteSuccess={handleDeleteSuccess}
               teamId={teamId}
            />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Team Info */}
            <div className="lg:col-span-1 space-y-6">
               <TeamInfoCard team={team} />
            </div>

            {/* Right column - Members */}
            <div className="lg:col-span-2 space-y-6">
               <TeamMembersCard members={team.members ?? []} teamId={teamId} />
            </div>
         </div>
      </main>
   );
}

function TeamDetailsPageSkeleton() {
   return (
      <main className="space-y-6">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Skeleton className="size-8" />
               <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
               </div>
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-9 w-24" />
               <Skeleton className="h-9 w-24" />
            </div>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
               <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-6">
               <Skeleton className="h-64 w-full" />
            </div>
         </div>
      </main>
   );
}

function TeamDetailsPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();

   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Users className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load team</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/organization/teams",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <ArrowLeft className="size-4 mr-2" />
                        Back to teams
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        {translate("common.actions.retry")}
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function TeamDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={TeamDetailsPageError}>
         <Suspense fallback={<TeamDetailsPageSkeleton />}>
            <TeamDetailsContent />
         </Suspense>
      </ErrorBoundary>
   );
}

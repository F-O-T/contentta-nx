import { Alert, AlertDescription } from "@packages/ui/components/alert";
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
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

// Error Fallback Component
function StatErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Failed to load statistics</AlertDescription>
      </Alert>
   );
}

// Loading Skeleton Component
function StatSkeleton() {
   return (
      <Card className="col-span-1 h-full w-full">
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
   );
}

// Members Stat Component
function MembersStat() {
   const trpc = useTRPC();
   const { data: members } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationMembers.queryOptions(),
   );

   return (
      <StatsCard
         description="Total organization members"
         title="Members"
         value={String(members?.length || 0)}
      />
   );
}

// Teams Stat Component
function TeamsStat() {
   const trpc = useTRPC();
   const { data: teams } = useSuspenseQuery(
      trpc.organization.listTeams.queryOptions(),
   );

   return (
      <StatsCard
         description="Active teams in organization"
         title="Teams"
         value={String(teams?.length || 0)}
      />
   );
}

// Authors Stat Component (replacing Projects)
function AuthorsStat() {
   const trpc = useTRPC();
   const { data: authors } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationAuthors.queryOptions(),
   );

   return (
      <StatsCard
         description="Total authors in organization"
         title="Authors"
         value={String(authors || 0)}
      />
   );
}

export function OrganizationStats() {
   return (
      <div className="grid md:grid-cols-3 gap-4">
         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <MembersStat />
            </Suspense>
         </ErrorBoundary>

         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <TeamsStat />
            </Suspense>
         </ErrorBoundary>

         <ErrorBoundary FallbackComponent={StatErrorFallback}>
            <Suspense fallback={<StatSkeleton />}>
               <AuthorsStat />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}

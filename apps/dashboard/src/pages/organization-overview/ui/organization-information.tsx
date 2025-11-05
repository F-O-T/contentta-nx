import { translate } from "@packages/localization";
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
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";

function OrganizationInformationErrorFallback() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("pages.organization.overview.information.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "pages.organization.overview.information.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate(
                        "pages.organization.overview.information.state.error.title",
                     )}
                  </EmptyTitle>
                  <EmptyDescription>
                     {translate(
                        "pages.organization.overview.information.state.error.description",
                     )}
                  </EmptyDescription>
               </EmptyHeader>
               <EmptyContent>
                  <button
                     className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                     onClick={() => window.location.reload()}
                     type="button"
                  >
                     {translate("common.actions.retry")}
                  </button>
               </EmptyContent>
            </Empty>
         </CardContent>
      </Card>
   );
}

function OrganizationInformationSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
               View your organization details and information
            </CardDescription>
         </CardHeader>
         <CardContent className="grid place-items-center gap-4">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div className="text-center space-y-2">
               <Skeleton className="h-5 w-32 mx-auto" />
               <Skeleton className="h-4 w-48 mx-auto" />
            </div>
         </CardContent>
      </Card>
   );
}

function OrganizationInformationContent() {
   const trpc = useTRPC();
   const { data: organization } = useSuspenseQuery(
      trpc.authHelpers.getDefaultOrganization.queryOptions(),
   );

   return (
      <Card className="w-full h-full">
         <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
               View your organization details and information
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                     Error loading organization information
                  </EmptyTitle>
                  <EmptyDescription>
                     Failed to load organization information. Please try again.
                  </EmptyDescription>
               </EmptyHeader>
               <EmptyContent>
                  <button
                     className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                     onClick={() => window.location.reload()}
                     type="button"
                  >
                     Retry
                  </button>
               </EmptyContent>
            </Empty>
         </CardContent>
      </Card>
   );
}

export function OrganizationInformation() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationInformationErrorFallback}>
         <Suspense fallback={<OrganizationInformationSkeleton />}>
            <OrganizationInformationContent />
         </Suspense>
      </ErrorBoundary>
   );
}

import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function ProfileInformationErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.information.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.information.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.information.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.information.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function ProfileInformationSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/2" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-3/4" />
            </CardDescription>
         </CardHeader>
         <CardContent className="grid place-items-center gap-4">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="text-center space-y-2">
               <Skeleton className="h-5 w-32 mx-auto" />
               <Skeleton className="h-4 w-48 mx-auto" />
            </div>
         </CardContent>
      </Card>
   );
}

function ProfileInformationContent() {
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   return (
      <Card className="w-full h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.information.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.information.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="grid place-items-center gap-4">
            <Avatar className="w-24 h-24">
               <AvatarImage
                  alt={session?.user?.name || "Profile picture"}
                  src={session?.user?.image || undefined}
               />
               <AvatarFallback>
                  {getInitials(
                     session?.user?.name || "",
                     session?.user?.email || "",
                  )}
               </AvatarFallback>
            </Avatar>
         </CardContent>
      </Card>
   );
}

export function ProfileInformation() {
   return (
      <ErrorBoundary FallbackComponent={ProfileInformationErrorFallback}>
         <Suspense fallback={<ProfileInformationSkeleton />}>
            <ProfileInformationContent />
         </Suspense>
      </ErrorBoundary>
   );
}

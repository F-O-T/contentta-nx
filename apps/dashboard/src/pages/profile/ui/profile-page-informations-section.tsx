import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
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
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function ProfileInformationErrorFallback() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("pages.profile.information.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.profile.information.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate("pages.profile.information.state.error.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                     {translate(
                        "pages.profile.information.state.error.description",
                     )}
                  </EmptyDescription>
               </EmptyHeader>
               <EmptyContent>
                  <Button
                     onClick={() => window.location.reload()}
                     size="sm"
                     variant="outline"
                  >
                     {translate("common.actions.retry")}
                  </Button>
               </EmptyContent>
            </Empty>
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
               {translate("pages.profile.information.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.profile.information.description")}
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
            <Item className=" text-center">
               <ItemContent>
                  <ItemTitle>{session?.user?.name}</ItemTitle>
                  <ItemDescription>{session?.user?.email}</ItemDescription>
               </ItemContent>
            </Item>
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

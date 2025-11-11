import { Alert, AlertDescription } from "@packages/ui/components/alert";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

// Error Fallback Component
function OrganizationInfoErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            Failed to load organization information
         </AlertDescription>
      </Alert>
   );
}

// Loading Skeleton Component
function OrganizationInfoSkeleton() {
   return (
      <Item className="w-full rounded-lg" variant="outline">
         <ItemMedia>
            <Skeleton className="size-12 rounded-full" />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>
               <Skeleton className="h-5 w-32" />
            </ItemTitle>
            <ItemDescription>
               <Skeleton className="h-4 w-48" />
            </ItemDescription>
         </ItemContent>
      </Item>
   );
}

// Internal avatar component that makes the API call
function OrganizationAvatar() {
   const trpc = useTRPC();
   const { data: orgData } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   return (
      <Avatar className="rounded-lg size-10">
         <ErrorBoundary FallbackComponent={LogoErrorFallback}>
            <Suspense fallback={<Skeleton className="size-10 rounded-full" />}>
               <OrganizationLogo />
            </Suspense>
         </ErrorBoundary>
         <AvatarFallback>{getInitials(orgData?.name ?? "")}</AvatarFallback>
      </Avatar>
   );
}

// Logo Component with separate error boundary
function OrganizationLogo() {
   const trpc = useTRPC();
   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   return <AvatarImage className="rounded-lg" src={logo?.data} />;
}

// Content Component
function OrganizationContent() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   return (
      <ItemContent>
         <ItemTitle>{data?.name}</ItemTitle>
         <ItemDescription>{data?.description ?? "No summary"}</ItemDescription>
      </ItemContent>
   );
}

// Error Fallback for logo only
function LogoErrorFallback() {
   return (
      <Avatar className="size-12">
         <AvatarFallback>ORG</AvatarFallback>
      </Avatar>
   );
}

// Error Fallback for content only
function ContentErrorFallback() {
   return (
      <ItemContent>
         <ItemTitle>Organization</ItemTitle>
         <ItemDescription>
            Unable to load organization information
         </ItemDescription>
      </ItemContent>
   );
}

export function OrganizationInfo() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationInfoErrorFallback}>
         <Suspense fallback={<OrganizationInfoSkeleton />}>
            <Item className="w-full rounded-lg" variant="outline">
               <ItemMedia variant="image">
                  <OrganizationAvatar />
               </ItemMedia>
               <ErrorBoundary FallbackComponent={ContentErrorFallback}>
                  <Suspense
                     fallback={
                        <ItemContent>
                           <ItemTitle>
                              <Skeleton className="h-5 w-32" />
                           </ItemTitle>
                           <ItemDescription>
                              <Skeleton className="h-4 w-48" />
                           </ItemDescription>
                        </ItemContent>
                     }
                  >
                     <OrganizationContent />
                  </Suspense>
               </ErrorBoundary>
            </Item>
         </Suspense>
      </ErrorBoundary>
   );
}

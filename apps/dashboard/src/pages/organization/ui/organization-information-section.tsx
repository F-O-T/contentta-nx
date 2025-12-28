import { translate } from "@packages/localization";
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
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function OrganizationAvatar() {
   const { activeOrganization } = useActiveOrganization();

   return (
      <Avatar className="rounded-lg size-10">
         <ErrorBoundary FallbackComponent={LogoErrorFallback}>
            <Suspense fallback={<Skeleton className="size-10 rounded-full" />}>
               <OrganizationLogo />
            </Suspense>
         </ErrorBoundary>
         <AvatarFallback>
            {getInitials(activeOrganization?.name ?? "")}
         </AvatarFallback>
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
   const { activeOrganization } = useActiveOrganization();

   return (
      <ItemContent>
         <ItemTitle>{activeOrganization?.name}</ItemTitle>
         <ItemDescription>
            {activeOrganization?.description ?? "No summary"}
         </ItemDescription>
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
         <ItemTitle>
            {translate(
               "dashboard.routes.organization.information-section.state.error.title",
            )}
         </ItemTitle>
         <ItemDescription>
            {translate(
               "dashboard.routes.organization.information-section.state.error.description",
            )}
         </ItemDescription>
      </ItemContent>
   );
}

export function OrganizationInfo() {
   return (
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
   );
}

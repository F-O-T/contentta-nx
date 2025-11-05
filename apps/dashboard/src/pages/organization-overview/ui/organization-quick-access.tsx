import { translate } from "@packages/localization";
import {
   Card,
   CardAction,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, Building2, Users } from "lucide-react";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";

function OrganizationQuickAccessErrorFallback() {
   const errorCards = [
      {
         description: "Failed to load quick access options",
         disabled: true,
         icon: <AlertCircle className="w-4 h-4" />,
         onClick: () => {},
         title: "Error",
      },
      {
         description: "Failed to load quick access options",
         disabled: true,
         icon: <AlertCircle className="w-4 h-4" />,
         onClick: () => {},
         title: "Error",
      },
   ];

   return (
      <div className="space-y-4">
         {errorCards.map((card, index) => (
            <QuickAccessCard
               description={card.description}
               disabled={card.disabled}
               icon={card.icon}
               key={`${card.title}-${index + 1}`}
               onClick={card.onClick}
               title={card.title}
            />
         ))}
      </div>
   );
}

function OrganizationQuickAccessSkeleton() {
   return (
      <div className="space-y-4">
         {Array.from({ length: 2 }).map((_, index) => (
            <Card key={`quick-access-skeleton-${index + 1}`}>
               <CardAction className="px-6 flex items-center justify-between w-full">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="size-4" />
               </CardAction>
               <CardHeader>
                  <CardTitle>
                     <Skeleton className="h-6 w-3/4" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-4 w-full" />
                  </CardDescription>
               </CardHeader>
            </Card>
         ))}
      </div>
   );
}

function OrganizationQuickAccessContent() {
   const router = useRouter();

   // Memoize quick access cards
   const quickAccessCards = useMemo(
      () => [
         {
            description: "Access your organization settings and details",
            icon: <Building2 className="w-4 h-4" />,
            onClick: () => router.navigate({ to: "/organization" }),
            title: "Organization",
         },
         {
            description: "Manage organization members and permissions",
            icon: <Users className="w-4 h-4" />,
            onClick: () => router.navigate({ to: "/organization/members" }),
            title: "Members",
         },
      ],
      [router],
   );

   return (
      <div className="grid gap-4">
         {quickAccessCards.map((card, index) => (
            <QuickAccessCard
               description={card.description}
               icon={card.icon}
               key={`${card.title}-${index + 1}`}
               onClick={card.onClick}
               title={card.title}
            />
         ))}
      </div>
   );
}

function OrganizationQuickAccessWithErrorBoundary() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationQuickAccessErrorFallback}>
         <Suspense fallback={<OrganizationQuickAccessSkeleton />}>
            <OrganizationQuickAccessContent />
         </Suspense>
      </ErrorBoundary>
   );
}

export { OrganizationQuickAccessWithErrorBoundary as OrganizationQuickAccess };

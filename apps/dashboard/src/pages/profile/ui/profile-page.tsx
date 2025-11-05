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
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, Building2, Key } from "lucide-react";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ProfilePageBilling } from "./profile-page-billing";
import { ProfileInformation } from "./profile-page-informations-section";
import { NotificationSettingsSection } from "./profile-page-notification-settings-section";
import { PreferencesSection } from "./profile-page-preferences-sections";
import { ProfilePageSessionsSection } from "./profile-page-sessions-section";

function QuickAccessCardsErrorFallback() {
   const errorCards = [
      {
         description: translate(
            "pages.profile.quick-access.state.error.description",
         ),
         disabled: true,
         icon: <AlertCircle className="w-4 h-4" />,
         onClick: () => {},
         title: translate("pages.profile.quick-access.state.error.title"),
      },
      {
         description: translate(
            "pages.profile.quick-access.state.error.description",
         ),
         disabled: true,
         icon: <AlertCircle className="w-4 h-4" />,
         onClick: () => {},
         title: translate("pages.profile.quick-access.state.error.title"),
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

function QuickAccessCardsSkeleton() {
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

function QuickAccessCards() {
   const router = useRouter();
   const trpc = useTRPC();

   const { data: billingInfo } = useSuspenseQuery(
      trpc.authHelpers.getBillingInfo.queryOptions(),
   );

   const hasActiveSubscription = useMemo(
      () => billingInfo.billingState === "active_subscription",
      [billingInfo.billingState],
   );

   // Memoize quick access cards
   const quickAccessCards = useMemo(
      () => [
         {
            description: translate(
               "pages.profile.quick-access.organization.description",
            ),
            icon: <Building2 className="w-4 h-4" />,
            onClick: () => router.navigate({ to: "/organization" }),
            title: translate("pages.profile.quick-access.organization.title"),
         },
         {
            description: translate(
               "pages.profile.quick-access.api-keys.description",
            ),
            icon: <Key className="w-4 h-4" />,
            onClick: () => router.navigate({ to: "/apikey" }),
            title: translate("pages.profile.quick-access.api-keys.title"),
         },
      ],
      [router],
   );

   return (
      <div className=" grid gap-4">
         {quickAccessCards.map((card, index) => (
            <QuickAccessCard
               description={card.description}
               disabled={!hasActiveSubscription}
               icon={card.icon}
               key={`${card.title}-${index + 1}`}
               onClick={card.onClick}
               title={card.title}
            />
         ))}
      </div>
   );
}

function QuickAccessCardsWithErrorBoundary() {
   return (
      <ErrorBoundary FallbackComponent={QuickAccessCardsErrorFallback}>
         <Suspense fallback={<QuickAccessCardsSkeleton />}>
            <QuickAccessCards />
         </Suspense>
      </ErrorBoundary>
   );
}

export function ProfilePage() {
   return (
      <main className="flex flex-col h-full w-full gap-4 ">
         <TalkingMascot message={translate("pages.profile.mascot-message")} />

         <div className="grid md:grid-cols-3 gap-4 ">
            <div className="md:col-span-1">
               <ProfileInformation />
            </div>
            <ProfilePageBilling />
            <div className="grid cols-span-1 gap-4 h-full">
               <QuickAccessCardsWithErrorBoundary />
            </div>

            <div className="md:col-span-3 grid md:grid-cols-2 gap-4">
               <NotificationSettingsSection />
               <PreferencesSection />
            </div>
         </div>
         <ProfilePageSessionsSection />
      </main>
   );
}

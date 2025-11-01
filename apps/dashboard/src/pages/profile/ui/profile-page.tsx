import { translate } from "@packages/localization";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useRouter } from "@tanstack/react-router";
import { Building2, Key } from "lucide-react";
import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ProfilePageBilling } from "./profile-page-billing";
import { ProfileInformation } from "./profile-page-informations-section";
import { NotificationSettingsSection } from "./profile-page-notification-settings-section";
import { PreferencesSection } from "./profile-page-preferences-sections";
import { ProfilePageSessionsSection } from "./profile-page-sessions-section";
export function ProfilePage() {
   const router = useRouter();
   const trpc = useTRPC();

   const { data: billingInfo } = useSuspenseQuery(
      trpc.authHelpers.getBillingInfo.queryOptions(),
   );

   const hasActiveSubscription = billingInfo.billingState === "active_subscription";

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
      <main className="flex flex-col h-full w-full gap-4 ">
         <TalkingMascot message={translate("pages.profile.mascot-message")} />

         <div className="grid md:grid-cols-3 gap-4 ">
            <div className="md:col-span-1">
               <ProfileInformation />
            </div>
            <ProfilePageBilling />
            <div className="grid cols-span-1 gap-4">
               {quickAccessCards.map((card, index) => (
                  <QuickAccessCard
                     description={card.description}
                     icon={card.icon}
                     key={`${card.title}-${index + 1}`}
                     onClick={card.onClick}
                     title={card.title}
                     disabled={!hasActiveSubscription}
                  />
               ))}
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

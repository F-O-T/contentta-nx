import { translate } from "@packages/localization";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useRouter } from "@tanstack/react-router";
import { Building2, Key } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ProfilePageBilling } from "./profile-page-billing";
import { ProfileInformation } from "./profile-page-informations-section";
import { NotificationSettingsSection } from "./profile-page-notification-settings-section";
import { PreferencesSection } from "./profile-page-preferences-sections";
import { ProfilePageSessionsSection } from "./profile-page-sessions-section";
export function ProfilePage() {
   const router = useRouter();

   return (
      <main className="flex flex-col h-full w-full gap-4 ">
         <TalkingMascot message={translate("pages.profile.mascot-message")} />

         <div className="grid md:grid-cols-3 gap-4 ">
            <div className="md:col-span-1">
               <ProfileInformation />
            </div>
            <ProfilePageBilling />
            <div className="grid cols-span-1 gap-4">
               <QuickAccessCard
                  description="Manage your organization settings"
                  icon={<Building2 className="w-4 h-4" />}
                  onClick={() => router.navigate({ to: "/organization" })}
                  title="Organization"
               />
               <QuickAccessCard
                  description="Manage your API keys and tokens"
                  icon={<Key className="w-4 h-4" />}
                  onClick={() => router.navigate({ to: "/apikey" })}
                  title="API Keys"
               />
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

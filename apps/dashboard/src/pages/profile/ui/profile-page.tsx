import { translate } from "@packages/localization";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ProfilePageBilling } from "./profile-page-billing";
import { ProfileInformation } from "./profile-page-informations-section";
import { PreferencesSection } from "./profile-page-preferences-sections";
import { ProfilePageSessionsSection } from "./profile-page-sessions-section";
import { NotificationSettingsSection } from "./profile-page-notification-settings-section";
export function ProfilePage() {
   return (
      <main className="flex flex-col h-full w-full gap-4 ">
         <TalkingMascot message={translate("pages.profile.mascot-message")} />

         <div className="grid md:grid-cols-3 gap-4 ">
            <div className="md:col-span-1">
               <ProfileInformation />
            </div>
            <ProfilePageBilling />
            <div className="md:col-span-3 grid grid-cols-2 gap-4">
               <NotificationSettingsSection />
               <PreferencesSection />
            </div>
         </div>
         <ProfilePageSessionsSection />
      </main>
   );
}

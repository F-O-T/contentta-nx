import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { OrganizationInfo } from "./organization-information-section";
import { QuickAccessCards } from "./organization-quick-access-cards";
import { QuickActionsToolbar } from "./organization-quick-actions-toolbar";
import { RecentInvites } from "./organization-recent-invites-section";
import { OrganizationRoles } from "./organization-recent-users-sections";
import { OrganizationStats } from "./organization-stats";

export function OrganizationPage() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <TalkingMascot message="Here you can see your organization details" />

         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2 grid gap-4">
               <QuickActionsToolbar />
               <OrganizationInfo />
               <OrganizationStats />
            </div>
            <QuickAccessCards />
         </div>

         <div className="grid md:grid-cols-2 md:col-span-3 gap-4">
            <OrganizationRoles />
            <RecentInvites />
         </div>
      </main>
   );
}

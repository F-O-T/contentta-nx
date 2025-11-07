import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { InvitesStats } from "./organization-invites-stats";
import { InvitesQuickActionsToolbar } from "./organization-invites-quick-actions-toolbar";
import { InvitesListSection } from "./organization-invites-list-section";
import { PendingInvitesSection } from "./organization-pending-invites-section";

export function OrganizationInvitesPage() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <TalkingMascot message="Here you can manage all organization invitations" />

         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2 grid gap-4">
               <InvitesQuickActionsToolbar />
               <InvitesStats />
            </div>
         </div>

         <div className="grid md:grid-cols-2 gap-4">
            <InvitesListSection />
            <PendingInvitesSection />
         </div>
      </main>
   );
}
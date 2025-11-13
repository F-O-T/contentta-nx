import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { MembersListSection } from "./organization-members-list-section";
import { MembersQuickActionsToolbar } from "./organization-members-quick-actions-toolbar";
import { MembersStats } from "./organization-members-stats";

export function OrganizationMembersPage() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <TalkingMascot message="Here you can manage all organization members" />

         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 h-min md:col-span-2 grid gap-4">
               <MembersQuickActionsToolbar />
               <MembersListSection />
            </div>
            <MembersStats />
         </div>
      </main>
   );
}
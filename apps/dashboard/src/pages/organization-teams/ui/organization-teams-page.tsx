import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { TeamsListSection } from "./organization-teams-list-section";
import { TeamsQuickActionsToolbar } from "./organization-teams-quick-actions-toolbar";
import { TeamsStats } from "./organization-teams-stats";

export function OrganizationTeamsPage() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <TalkingMascot message="Here you can manage all organization teams" />

         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 h-min md:col-span-2 grid gap-4">
               <TeamsQuickActionsToolbar />
               <TeamsListSection />
            </div>
            <TeamsStats />
         </div>
      </main>
   );
}

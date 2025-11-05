import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { Link } from "@tanstack/react-router";
import { FileArchive, UsersIcon } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { QuickActions } from "./quick-actions";
import { OrganizationInformation } from "./organization-information";
import { OrganizationQuickAccess } from "./organization-quick-access";
import { OrganizationStats } from "./organization-stats";
export function OrganizationOverviewPage() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <TalkingMascot message="Here you can see your organization overview" />

         <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
               <OrganizationInformation />
            </div>
            <OrganizationStats />
            <div className="grid cols-span-1 gap-4 h-full">
               <OrganizationQuickAccess />
            </div>

            <div className="md:col-span-3 grid md:grid-cols-2 gap-4">
               <Card>
                  <CardHeader>
                     <CardTitle>Quick actions</CardTitle>
                     <CardDescription>
                        Here you can quickly access some actions
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                     <QuickActions />
                  </CardContent>
               </Card>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/organization/members">
                     <SquaredIconButton>
                        <UsersIcon /> Members
                     </SquaredIconButton>
                  </Link>
                  <Link to="/organization/brand">
                     <SquaredIconButton>
                        <FileArchive /> Brand
                     </SquaredIconButton>
                  </Link>
               </div>
            </div>
         </div>
      </main>
   );
}

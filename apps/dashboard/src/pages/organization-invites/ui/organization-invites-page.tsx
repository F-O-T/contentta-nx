import { translate } from "@packages/localization";
import { DefaultHeader } from "@/default/default-header";
import { InvitesListSection } from "./organization-invites-list-section";
import { InvitesQuickActionsToolbar } from "./organization-invites-quick-actions-toolbar";

export function OrganizationInvitesPage() {
   return (
      <main className="flex flex-col gap-4">
         <DefaultHeader
            actions={<InvitesQuickActionsToolbar />}
            description={translate(
               "dashboard.routes.organization.invites-table.description",
            )}
            title={translate(
               "dashboard.routes.organization.invites-table.title",
            )}
         />
         <InvitesListSection />
      </main>
   );
}

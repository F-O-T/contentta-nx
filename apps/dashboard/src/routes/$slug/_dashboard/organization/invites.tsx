import { createFileRoute } from "@tanstack/react-router";
import { OrganizationInvitesPage } from "@/pages/organization-invites/ui/organization-invites-page";

export const Route = createFileRoute("/$slug/_dashboard/organization/invites")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Invites",
   },
});

function RouteComponent() {
   return <OrganizationInvitesPage />;
}

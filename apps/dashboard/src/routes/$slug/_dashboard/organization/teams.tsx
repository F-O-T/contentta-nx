import { createFileRoute } from "@tanstack/react-router";
import { OrganizationTeamsPage } from "@/pages/organization-teams/ui/organization-teams-page";

export const Route = createFileRoute("/$slug/_dashboard/organization/teams")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Teams",
   },
});

function RouteComponent() {
   return <OrganizationTeamsPage />;
}

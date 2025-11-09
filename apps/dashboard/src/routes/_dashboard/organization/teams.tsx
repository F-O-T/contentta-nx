import { createFileRoute } from "@tanstack/react-router";
import { OrganizationTeamsPage } from "@/pages/organization-teams/ui/organization-teams-page";

export const Route = createFileRoute("/_dashboard/organization/teams")({
   component: RouteComponent,
});

function RouteComponent() {
   return <OrganizationTeamsPage />;
}
import { OrganizationMembersPage } from "@/pages/organization-members/ui/organization-members-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/organization/members")({
   component: RouteComponent,
});

function RouteComponent() {
   return <OrganizationMembersPage />;
}

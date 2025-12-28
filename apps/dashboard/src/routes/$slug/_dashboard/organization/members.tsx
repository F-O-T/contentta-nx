import { createFileRoute } from "@tanstack/react-router";
import { OrganizationMembersPage } from "@/pages/organization-members/ui/organization-members-page";

export const Route = createFileRoute("/$slug/_dashboard/organization/members")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Members",
   },
});

function RouteComponent() {
   return <OrganizationMembersPage />;
}

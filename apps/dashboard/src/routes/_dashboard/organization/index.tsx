import { createFileRoute } from "@tanstack/react-router";
import { OrganizationPage } from "@/pages/organization/ui/organization-page";

export const Route = createFileRoute("/_dashboard/organization/")({
   component: RouteComponent,
});

function RouteComponent() {
   return <OrganizationPage />;
}

import { createFileRoute } from "@tanstack/react-router";
import { OrganizationPage } from "@/pages/organization/ui/organization-page";

export const Route = createFileRoute("/$slug/_dashboard/organization/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Organization",
   },
});

function RouteComponent() {
   return <OrganizationPage />;
}

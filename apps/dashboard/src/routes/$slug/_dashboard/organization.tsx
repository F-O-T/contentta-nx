import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OrganizationLayout } from "@/pages/organization/ui/organization-layout";

export const Route = createFileRoute("/$slug/_dashboard/organization")({
   component: OrganizationLayoutRoute,
});

function OrganizationLayoutRoute() {
   return (
      <OrganizationLayout>
         <Outlet />
      </OrganizationLayout>
   );
}

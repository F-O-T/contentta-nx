import { createFileRoute } from "@tanstack/react-router";
import { ManagePlanPage } from "@/pages/manage-plan/ui/manage-plan-page";

export const Route = createFileRoute("/$slug/_dashboard/manage-plan")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Gerenciar Plano",
   },
});

function RouteComponent() {
   return <ManagePlanPage />;
}

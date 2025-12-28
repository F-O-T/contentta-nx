import { createFileRoute } from "@tanstack/react-router";
import { PlansPage } from "@/pages/plans/ui/plans-page";

export const Route = createFileRoute("/$slug/_dashboard/plans")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Planos",
   },
   validateSearch: (search: Record<string, unknown>) => ({
      success: search.success as string | undefined,
   }),
});

function RouteComponent() {
   return <PlansPage />;
}

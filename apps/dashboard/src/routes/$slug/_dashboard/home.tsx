import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/home/ui/home-page";

export const Route = createFileRoute("/$slug/_dashboard/home")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Home",
   },
});

function RouteComponent() {
   return <HomePage />;
}

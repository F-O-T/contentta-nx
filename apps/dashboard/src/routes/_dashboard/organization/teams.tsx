import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/organization/teams")({
   component: RouteComponent,
});

function RouteComponent() {
   return "teams";
}

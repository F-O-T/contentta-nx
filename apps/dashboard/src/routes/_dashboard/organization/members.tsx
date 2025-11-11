import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/organization/members")({
   component: RouteComponent,
});

function RouteComponent() {
   return "members";
}

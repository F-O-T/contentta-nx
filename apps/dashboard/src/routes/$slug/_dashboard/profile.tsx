import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/$slug/_dashboard/profile")({
   component: ProfileRedirect,
});

function ProfileRedirect() {
   const { slug } = Route.useParams();
   return <Navigate params={{ slug }} replace to="/$slug/settings/profile" />;
}

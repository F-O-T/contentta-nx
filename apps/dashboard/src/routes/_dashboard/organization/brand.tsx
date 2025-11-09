import { BrandDetailsPage } from "@/pages/organization-brand/ui/brand-details-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/organization/brand")({
   component: RouteComponent,
});

function RouteComponent() {
   return <BrandDetailsPage />;
}

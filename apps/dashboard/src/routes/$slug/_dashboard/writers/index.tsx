import { createFileRoute } from "@tanstack/react-router";
import { WritersPage } from "@/pages/writers/ui/writers-page";

export const Route = createFileRoute("/$slug/_dashboard/writers/")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Writers",
	},
});

function RouteComponent() {
	return <WritersPage />;
}

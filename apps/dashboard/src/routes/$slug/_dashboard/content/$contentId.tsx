import { createFileRoute } from "@tanstack/react-router";
import { ContentDetailsPage } from "@/pages/content/ui/content-details-page";

export const Route = createFileRoute("/$slug/_dashboard/content/$contentId")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Content Details",
	},
});

function RouteComponent() {
	const { contentId } = Route.useParams();
	return <ContentDetailsPage contentId={contentId} />;
}

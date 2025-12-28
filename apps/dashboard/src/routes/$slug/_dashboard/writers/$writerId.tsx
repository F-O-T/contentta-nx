import { createFileRoute } from "@tanstack/react-router";
import { WriterDetailsPage } from "@/pages/writers/ui/writer-details-page";

export const Route = createFileRoute("/$slug/_dashboard/writers/$writerId")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Writer Details",
	},
});

function RouteComponent() {
	const { writerId } = Route.useParams();
	return <WriterDetailsPage writerId={writerId} />;
}

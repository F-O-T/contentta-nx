import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ContentPage } from "@/pages/content/ui/content-page";

const searchSchema = z.object({
	agentId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/$slug/_dashboard/content/")({
	component: RouteComponent,
	validateSearch: searchSchema,
	staticData: {
		breadcrumb: "Content",
	},
});

function RouteComponent() {
	return <ContentPage />;
}

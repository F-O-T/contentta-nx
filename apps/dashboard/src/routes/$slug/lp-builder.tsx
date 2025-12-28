import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$slug/lp-builder")({
	component: RouteComponent,
	staticData: {
		breadcrumb: "Landing Page Builder",
	},
});

function RouteComponent() {
	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold">Landing Page Builder</h1>
			<p className="text-muted-foreground mt-2">Coming soon...</p>
		</div>
	);
}

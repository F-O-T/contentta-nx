import { translate } from "@packages/localization";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { HomeContentStatsCard } from "./home-content-stats-card";
import { HomeQuickActions } from "./home-quick-actions";
import { HomeRecentContentSection } from "./home-recent-content-section";

function HomePageErrorFallback(props: FallbackProps) {
	return createErrorFallback({
		errorDescription: translate(
			"dashboard.routes.home.state.error.description",
		),
		errorTitle: translate("dashboard.routes.home.state.error.title"),
		retryText: translate("common.actions.retry"),
	})(props);
}

function HomePageSkeleton() {
	return (
		<main className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-9 w-48" />
			</div>

			<Skeleton className="h-40 w-full" />

			<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton className="h-32" key={`skeleton-${i + 1}`} />
				))}
			</div>

			<Skeleton className="h-48 w-full" />

			<Skeleton className="h-[300px] w-full" />
		</main>
	);
}

function HomePageContent() {
	return (
		<main className="flex flex-col gap-6">
			<DefaultHeader
				description={translate("dashboard.routes.home.description")}
				title={translate("dashboard.routes.home.title")}
			/>

			<HomeContentStatsCard />

			<HomeQuickActions />

			<HomeRecentContentSection />
		</main>
	);
}

export function HomePage() {
	return (
		<ErrorBoundary FallbackComponent={HomePageErrorFallback}>
			<Suspense fallback={<HomePageSkeleton />}>
				<HomePageContent />
			</Suspense>
		</ErrorBoundary>
	);
}

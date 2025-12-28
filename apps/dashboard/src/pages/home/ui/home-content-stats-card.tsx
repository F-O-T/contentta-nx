import { translate } from "@packages/localization";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Archive, CheckCircle, PenLine } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function HomeContentStatsCardErrorFallback(props: FallbackProps) {
	return (
		<Card>
			<CardContent className="pt-6">
				{createErrorFallback({
					errorDescription: translate(
						"dashboard.routes.home.stats-card.state.error.description",
					),
					errorTitle: translate(
						"dashboard.routes.home.stats-card.state.error.title",
					),
					retryText: translate("common.actions.retry"),
				})(props)}
			</CardContent>
		</Card>
	);
}

function HomeContentStatsCardSkeleton() {
	return (
		<Card>
			<CardHeader className="text-center">
				<Skeleton className="h-4 w-32 mx-auto" />
				<Skeleton className="h-10 w-24 mx-auto" />
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton className="h-20 w-full" key={`skeleton-${i + 1}`} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

interface StatCardProps {
	icon: React.ReactNode;
	label: string;
	value: number;
	colorClass: string;
}

function StatCard({ icon, label, value, colorClass }: StatCardProps) {
	return (
		<Card className="bg-muted/50">
			<CardHeader className="pb-2">
				<div className="flex items-center gap-2">
					<div className={`rounded-full p-2 ${colorClass}`}>{icon}</div>
					<CardDescription>{label}</CardDescription>
				</div>
				<CardTitle className="text-xl">{value}</CardTitle>
			</CardHeader>
		</Card>
	);
}

function HomeContentStatsCardContent() {
	const trpc = useTRPC();

	const { data } = useSuspenseQuery(
		trpc.content.listAllContent.queryOptions({
			limit: 100,
			page: 1,
			status: ["draft", "published", "archived"],
		}),
	);

	const stats = {
		archived: data.items.filter((item) => item.status === "archived").length,
		draft: data.items.filter((item) => item.status === "draft").length,
		published: data.items.filter((item) => item.status === "published").length,
		total: data.total,
	};

	return (
		<Card>
			<CardHeader className="text-center pb-2">
				<CardDescription>
					{translate("dashboard.routes.home.stats-card.title")}
				</CardDescription>
				<CardTitle className="text-4xl font-bold">{stats.total}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-3 gap-4">
					<StatCard
						colorClass="bg-amber-500/10"
						icon={<PenLine className="size-4 text-amber-500" />}
						label={translate("dashboard.routes.home.stats-card.drafts")}
						value={stats.draft}
					/>
					<StatCard
						colorClass="bg-green-500/10"
						icon={<CheckCircle className="size-4 text-green-500" />}
						label={translate("dashboard.routes.home.stats-card.published")}
						value={stats.published}
					/>
					<StatCard
						colorClass="bg-slate-500/10"
						icon={<Archive className="size-4 text-slate-500" />}
						label={translate("dashboard.routes.home.stats-card.archived")}
						value={stats.archived}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

export function HomeContentStatsCard() {
	return (
		<ErrorBoundary FallbackComponent={HomeContentStatsCardErrorFallback}>
			<Suspense fallback={<HomeContentStatsCardSkeleton />}>
				<HomeContentStatsCardContent />
			</Suspense>
		</ErrorBoundary>
	);
}

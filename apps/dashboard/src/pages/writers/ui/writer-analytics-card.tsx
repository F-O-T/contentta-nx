import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3, Clock, FileCheck, FileText, FilePlus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

type WriterAnalyticsCardProps = {
	writerId: string;
};

function AnalyticsStat({
	icon: Icon,
	label,
	value,
	variant = "default",
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string | number;
	variant?: "default" | "success" | "warning";
}) {
	const variantClasses = {
		default: "bg-muted text-muted-foreground",
		success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	};

	return (
		<div className="flex items-center gap-3">
			<div className={`flex items-center justify-center size-10 rounded-lg ${variantClasses[variant]}`}>
				<Icon className="size-5" />
			</div>
			<div>
				<p className="text-2xl font-bold">{value}</p>
				<p className="text-sm text-muted-foreground">{label}</p>
			</div>
		</div>
	);
}

function WriterAnalyticsContent({ writerId }: WriterAnalyticsCardProps) {
	const trpc = useTRPC();

	const { data: writer } = useSuspenseQuery(
		trpc.agent.getById.queryOptions({ id: writerId }),
	);

	const contentCount = writer.contentCount ?? 0;
	const lastGeneratedAt = writer.lastGeneratedAt
		? new Date(writer.lastGeneratedAt).toLocaleDateString(undefined, {
				day: "numeric",
				month: "short",
				year: "numeric",
			})
		: translate("common.labels.not-set");

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="size-5" />
					{translate("dashboard.routes.writers.details.analytics-title")}
				</CardTitle>
				<CardDescription>
					{translate("dashboard.routes.writers.details.analytics-description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<AnalyticsStat
						icon={FileText}
						label={translate("dashboard.routes.writers.details.total-content")}
						value={contentCount}
					/>
					<AnalyticsStat
						icon={Clock}
						label={translate("dashboard.routes.writers.details.last-activity")}
						value={lastGeneratedAt}
					/>
					<div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
						<div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
							<FilePlus className="size-5" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground mb-1">
								{translate("dashboard.routes.writers.details.status")}
							</p>
							<Badge variant={contentCount > 0 ? "default" : "secondary"}>
								{contentCount > 0
									? translate("common.status.active")
									: translate("common.status.inactive")}
							</Badge>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function WriterAnalyticsSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-4 w-48 mt-1" />
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div className="flex items-center gap-3" key={`analytics-skeleton-${i + 1}`}>
							<Skeleton className="size-10 rounded-lg" />
							<div>
								<Skeleton className="h-7 w-12 mb-1" />
								<Skeleton className="h-4 w-24" />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function WriterAnalyticsError() {
	return null;
}

export function WriterAnalyticsCard({ writerId }: WriterAnalyticsCardProps) {
	return (
		<ErrorBoundary FallbackComponent={WriterAnalyticsError}>
			<Suspense fallback={<WriterAnalyticsSkeleton />}>
				<WriterAnalyticsContent writerId={writerId} />
			</Suspense>
		</ErrorBoundary>
	);
}

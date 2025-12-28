import { translate } from "@packages/localization";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@packages/ui/components/avatar";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FileText, TrendingUp, Users } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function StatCard({
	icon: Icon,
	title,
	value,
	description,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	value: number | string;
	description: string;
}) {
	return (
		<Card className="col-span-1">
			<CardHeader>
				<div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
					<Icon className="size-4" />
					{title}
				</div>
				<CardTitle className="text-2xl">{value}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
		</Card>
	);
}

function StatCardSkeleton() {
	return (
		<Card className="col-span-1">
			<CardHeader>
				<Skeleton className="h-4 w-24 mb-1" />
				<Skeleton className="h-8 w-16 mb-1" />
				<Skeleton className="h-4 w-32" />
			</CardHeader>
		</Card>
	);
}

function WritersStatsContent() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(trpc.agent.getStats.queryOptions());

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				description={translate("dashboard.routes.writers.stats.writers-description")}
				icon={Users}
				title={translate("dashboard.routes.writers.stats.writers")}
				value={data.totalAgents}
			/>
			<StatCard
				description={translate("dashboard.routes.writers.stats.content-description")}
				icon={FileText}
				title={translate("dashboard.routes.writers.stats.content")}
				value={data.totalContent}
			/>
			{data.mostActiveAgent ? (
				<Card className="col-span-1">
					<CardHeader>
						<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
							<TrendingUp className="size-4" />
							{translate("dashboard.routes.writers.stats.most-active")}
						</div>
						<div className="flex items-center gap-3">
							<Avatar className="size-10">
								<AvatarImage
									alt={data.mostActiveAgent.name}
									src={data.mostActiveAgent.profilePhotoUrl || undefined}
								/>
								<AvatarFallback>
									{getInitials(data.mostActiveAgent.name)}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="font-medium truncate">{data.mostActiveAgent.name}</p>
								<p className="text-sm text-muted-foreground">
									{data.mostActiveAgent.contentCount}{" "}
									{translate("dashboard.routes.writers.table.contents")}
								</p>
							</div>
						</div>
					</CardHeader>
				</Card>
			) : (
				<StatCard
					description={translate("dashboard.routes.writers.stats.most-active-empty")}
					icon={TrendingUp}
					title={translate("dashboard.routes.writers.stats.most-active")}
					value="-"
				/>
			)}
		</div>
	);
}

function WritersStatsSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCardSkeleton />
			<StatCardSkeleton />
			<Card className="col-span-1">
				<CardHeader>
					<Skeleton className="h-4 w-24 mb-2" />
					<div className="flex items-center gap-3">
						<Skeleton className="size-10 rounded-full" />
						<div className="flex-1">
							<Skeleton className="h-5 w-32 mb-1" />
							<Skeleton className="h-4 w-20" />
						</div>
					</div>
				</CardHeader>
			</Card>
		</div>
	);
}

function WritersStatsError() {
	return null;
}

export function WritersStats() {
	return (
		<ErrorBoundary FallbackComponent={WritersStatsError}>
			<Suspense fallback={<WritersStatsSkeleton />}>
				<WritersStatsContent />
			</Suspense>
		</ErrorBoundary>
	);
}

import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatStringForDisplay } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FileText, Sparkles } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

const STATUS_COLORS: Record<string, string> = {
	archived: "bg-slate-500/10 text-slate-600 border-slate-200",
	draft: "bg-amber-500/10 text-amber-600 border-amber-200",
	published: "bg-green-500/10 text-green-600 border-green-200",
};

function RecentContentCardHeader() {
	return (
		<CardHeader>
			<CardTitle className="flex items-center gap-2">
				<FileText className="size-5" />
				{translate("dashboard.routes.home.recent-content.title")}
			</CardTitle>
			<CardDescription>
				{translate("dashboard.routes.home.recent-content.description")}
			</CardDescription>
		</CardHeader>
	);
}

function HomeRecentContentSectionErrorFallback(props: FallbackProps) {
	return (
		<Card>
			<RecentContentCardHeader />
			<CardContent>
				{createErrorFallback({
					errorDescription: translate(
						"dashboard.routes.home.recent-content.state.error.description",
					),
					errorTitle: translate(
						"dashboard.routes.home.recent-content.state.error.title",
					),
					retryText: translate("common.actions.retry"),
				})(props)}
			</CardContent>
		</Card>
	);
}

function HomeRecentContentSectionSkeleton() {
	return (
		<Card className="w-full">
			<RecentContentCardHeader />
			<CardContent>
				<ItemGroup>
					{[1, 2, 3].map((index) => (
						<Fragment key={`skeleton-${index}`}>
							<div className="flex items-center justify-between gap-4 py-3">
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-32" />
								</div>
								<Skeleton className="h-6 w-16" />
							</div>
							{index !== 3 && <ItemSeparator />}
						</Fragment>
					))}
				</ItemGroup>
			</CardContent>
		</Card>
	);
}

function HomeRecentContentSectionContent() {
	const trpc = useTRPC();

	const { data } = useSuspenseQuery(
		trpc.content.listAllContent.queryOptions({
			limit: 5,
			page: 1,
			status: ["draft", "published", "archived"],
		}),
	);

	const contents = data.items;
	const hasContent = contents.length > 0;

	return (
		<Card className="w-full">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						<FileText className="size-5" />
						{translate("dashboard.routes.home.recent-content.title")}
					</CardTitle>
					<CardDescription>
						{translate("dashboard.routes.home.recent-content.description")}
					</CardDescription>
				</div>
				</CardHeader>
			<CardContent>
				{hasContent ? (
					<ItemGroup>
						{contents.map((content, index) => (
							<Fragment key={content.id}>
								<div className="flex items-center justify-between gap-4 py-3">
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">
											{content.meta?.title ||
												translate("common.labels.untitled")}
										</p>
										<p className="truncate text-sm text-muted-foreground">
											{new Date(content.createdAt).toLocaleDateString()}
										</p>
									</div>
									<Badge
										className={STATUS_COLORS[content.status || "draft"]}
										variant="outline"
									>
										{formatStringForDisplay(content.status || "draft")}
									</Badge>
								</div>
								{index !== contents.length - 1 && <ItemSeparator />}
							</Fragment>
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyContent>
							<EmptyMedia variant="icon">
								<Sparkles className="size-6" />
							</EmptyMedia>
							<EmptyTitle>
								{translate(
									"dashboard.routes.home.recent-content.state.empty.title",
								)}
							</EmptyTitle>
							<EmptyDescription>
								{translate(
									"dashboard.routes.home.recent-content.state.empty.description",
								)}
							</EmptyDescription>
						</EmptyContent>
					</Empty>
				)}
			</CardContent>
		</Card>
	);
}

export function HomeRecentContentSection() {
	return (
		<ErrorBoundary FallbackComponent={HomeRecentContentSectionErrorFallback}>
			<Suspense fallback={<HomeRecentContentSectionSkeleton />}>
				<HomeRecentContentSectionContent />
			</Suspense>
		</ErrorBoundary>
	);
}

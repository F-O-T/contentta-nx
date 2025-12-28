import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
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
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, Plus, Sparkles } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

const STATUS_COLORS: Record<string, string> = {
	archived: "bg-slate-500/10 text-slate-600 border-slate-200",
	draft: "bg-amber-500/10 text-amber-600 border-amber-200",
	published: "bg-green-500/10 text-green-600 border-green-200",
};

type WriterContentListProps = {
	agentId: string;
};

function WriterContentListSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-4 w-48" />
			</CardHeader>
			<CardContent>
				<ItemGroup>
					{Array.from({ length: 3 }).map((_, index) => (
						<Fragment key={`content-skeleton-${index + 1}`}>
							<div className="flex items-center justify-between gap-4 py-3">
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-32" />
								</div>
								<Skeleton className="h-6 w-16" />
							</div>
							{index !== 2 && <ItemSeparator />}
						</Fragment>
					))}
				</ItemGroup>
			</CardContent>
		</Card>
	);
}

function WriterContentListError() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileText className="size-5" />
					{translate("dashboard.routes.writers.details.content-title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">
					{translate("common.errors.default")}
				</p>
			</CardContent>
		</Card>
	);
}

function WriterContentListContent({ agentId }: WriterContentListProps) {
	const trpc = useTRPC();
	const { activeOrganization } = useActiveOrganization();

	const { data } = useSuspenseQuery(
		trpc.content.getByAgentId.queryOptions({
			agentId,
			limit: 10,
			page: 1,
		}),
	);

	const contents = data.items;
	const hasContent = contents.length > 0;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						<FileText className="size-5" />
						{translate("dashboard.routes.writers.details.content-title")}
					</CardTitle>
					<CardDescription>
						{translate("dashboard.routes.writers.details.content-description")}
					</CardDescription>
				</div>
				<Button asChild size="sm" variant="outline">
					<Link
						to="/$slug/content"
						params={{ slug: activeOrganization.slug }}
						search={{ agentId }}
					>
						<Plus className="size-4 mr-1" />
						{translate("dashboard.routes.writers.details.create-content")}
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				{hasContent ? (
					<ItemGroup>
						{contents.map((content, index) => (
							<Fragment key={content.id}>
								<Link
									className="flex items-center justify-between gap-4 py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
									to="/$slug/content/$contentId"
									params={{
										slug: activeOrganization.slug,
										contentId: content.id,
									}}
								>
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
										{translate(`common.status.${content.status || "draft"}`)}
									</Badge>
								</Link>
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
								{translate("dashboard.routes.writers.details.no-content")}
							</EmptyTitle>
							<EmptyDescription>
								{translate("dashboard.routes.writers.details.no-content-description")}
							</EmptyDescription>
						</EmptyContent>
					</Empty>
				)}
			</CardContent>
		</Card>
	);
}

export function WriterContentList({ agentId }: WriterContentListProps) {
	return (
		<ErrorBoundary FallbackComponent={WriterContentListError}>
			<Suspense fallback={<WriterContentListSkeleton />}>
				<WriterContentListContent agentId={agentId} />
			</Suspense>
		</ErrorBoundary>
	);
}

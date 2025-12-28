import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { WriterContentList } from "@/features/writers/ui/writer-content-list";
import { WriterInstructionsCard } from "@/features/writers/ui/writer-instructions-card";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { WriterActionButtons } from "./writer-action-buttons";
import { WriterAnalyticsCard } from "./writer-analytics-card";
import { WriterMetadataCard, WriterMetadataCardSkeleton } from "./writer-metadata-card";

type WriterDetailsPageProps = {
	writerId: string;
};

function WriterDetailsPageSkeleton() {
	return (
		<main className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="size-9" />
				<div className="flex-1">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-5 w-64 mt-2" />
				</div>
			</div>
			<div className="flex flex-wrap gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton className="h-9 w-28" key={`action-skeleton-${i + 1}`} />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-1 space-y-6">
					<WriterMetadataCardSkeleton />
				</div>
				<div className="lg:col-span-2 space-y-6">
					<Skeleton className="h-48" />
					<Skeleton className="h-64" />
				</div>
			</div>
		</main>
	);
}

function WriterDetailsPageError({ error }: { error: Error }) {
	const { activeOrganization } = useActiveOrganization();

	return (
		<main className="space-y-6">
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link
						params={{ slug: activeOrganization.slug }}
						to="/$slug/writers"
					>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">
						{translate("dashboard.routes.writers.details.error-title")}
					</h1>
				</div>
			</div>
			<div className="text-center py-8">
				<p className="text-muted-foreground">
					{translate("common.errors.default")}
				</p>
				<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
			</div>
		</main>
	);
}

function WriterDetailsPageContent({ writerId }: WriterDetailsPageProps) {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const { activeOrganization } = useActiveOrganization();

	const { data: writer } = useSuspenseQuery(
		trpc.agent.getById.queryOptions({ id: writerId }),
	);

	const handleDeleteSuccess = () => {
		navigate({
			params: { slug: activeOrganization.slug },
			to: "/$slug/writers",
		});
	};

	return (
		<main className="space-y-6">
			{/* Header with back button */}
			<div className="flex items-start gap-4">
				<Button asChild className="mt-1" size="icon" variant="ghost">
					<Link
						params={{ slug: activeOrganization.slug }}
						to="/$slug/writers"
					>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<DefaultHeader
					description={translate("dashboard.routes.writers.details.subtitle")}
					title={writer.personaConfig.metadata.name}
				/>
			</div>

			{/* Action Buttons */}
			<WriterActionButtons
				onDeleteSuccess={handleDeleteSuccess}
				writer={writer}
			/>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column - Metadata */}
				<div className="lg:col-span-1 space-y-6">
					<WriterMetadataCard writer={writer} />
				</div>

				{/* Right Column - Instructions & Content */}
				<div className="lg:col-span-2 space-y-6">
					<WriterInstructionsCard
						instructions={writer.personaConfig.instructions}
						writerId={writerId}
						writerName={writer.personaConfig.metadata.name}
					/>
					<WriterContentList agentId={writerId} />
				</div>

				{/* Full Width - Analytics */}
				<div className="lg:col-span-full">
					<WriterAnalyticsCard writerId={writerId} />
				</div>
			</div>
		</main>
	);
}

export function WriterDetailsPage({ writerId }: WriterDetailsPageProps) {
	return (
		<ErrorBoundary FallbackComponent={WriterDetailsPageError}>
			<Suspense fallback={<WriterDetailsPageSkeleton />}>
				<WriterDetailsPageContent writerId={writerId} />
			</Suspense>
		</ErrorBoundary>
	);
}

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Archive, ArrowLeft, Edit, PenLine, Send, Trash2 } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { ContentEditor } from "@/features/content/ui/content-editor";
import { ContentInfoCard } from "@/features/content/ui/content-info-card";
import { ContentStatsCard } from "@/features/content/ui/content-stats-card";
import { ManageContentForm } from "@/features/content/ui/manage-content-form";
import { ChatSidebar } from "@/features/content/ui/chat-sidebar";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type ContentDetailsPageProps = {
	contentId: string;
};

function ContentDetailsPageSkeleton() {
	return (
		<main className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Skeleton className="size-9" />
				<div className="flex-1">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-4 w-32 mt-1" />
				</div>
				<Skeleton className="h-9 w-20" />
				<Skeleton className="h-9 w-20" />
			</div>
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Skeleton className="h-[500px]" />
				</div>
				<div className="space-y-6">
					<Skeleton className="h-64" />
					<Skeleton className="h-40" />
				</div>
			</div>
		</main>
	);
}

function ContentDetailsPageError({ error }: { error: Error }) {
	const { activeOrganization } = useActiveOrganization();

	return (
		<main className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link
						to="/$slug/content"
						params={{ slug: activeOrganization.slug }}
					>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">
						{translate("dashboard.routes.content.details.error-title")}
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

function ContentDetailsPageContent({ contentId }: ContentDetailsPageProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { activeOrganization } = useActiveOrganization();
	const { openAlertDialog } = useAlertDialog();
	const { openSheet } = useSheet();
	const [isSaving, setIsSaving] = useState(false);

	const { data: content } = useSuspenseQuery(
		trpc.content.getById.queryOptions({ id: contentId }),
	);

	const updateMutation = useMutation(
		trpc.content.update.mutationOptions({
			onSuccess: () => {
				setIsSaving(false);
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
			},
			onError: (error) => {
				setIsSaving(false);
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const deleteMutation = useMutation(
		trpc.content.delete.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.delete-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
				navigate({
					to: "/$slug/content",
					params: { slug: activeOrganization.slug },
				});
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const publishMutation = useMutation(
		trpc.content.publish.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.publish-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const archiveMutation = useMutation(
		trpc.content.archive.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.archive-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const debouncedSave = useDebouncedCallback((body: string) => {
		setIsSaving(true);
		updateMutation.mutate({
			id: contentId,
			data: { body },
		});
	}, 1000);

	const handleContentChange = useCallback(
		(body: string) => {
			debouncedSave(body);
		},
		[debouncedSave],
	);

	const handleEdit = () => {
		openSheet({
			children: <ManageContentForm content={content} />,
		});
	};

	const handleDelete = () => {
		openAlertDialog({
			actionLabel: translate("common.actions.delete"),
			cancelLabel: translate("common.actions.cancel"),
			description: `${translate("common.headers.delete-confirmation.description")} "${content.meta.title}"?`,
			onAction: () => deleteMutation.mutate({ id: contentId }),
			title: translate("common.headers.delete-confirmation.title"),
			variant: "destructive",
		});
	};

	const handlePublish = () => {
		publishMutation.mutate({ id: contentId });
	};

	const handleArchive = () => {
		archiveMutation.mutate({ id: contentId });
	};

	return (
		<main className="flex flex-col gap-6">
			<div className="flex items-center gap-4 flex-wrap">
				<Button asChild size="icon" variant="ghost">
					<Link
						to="/$slug/content"
						params={{ slug: activeOrganization.slug }}
					>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1 min-w-0">
					<h1 className="text-2xl font-bold truncate">
						{content.meta.title || translate("common.labels.untitled")}
					</h1>
					<p className="text-muted-foreground flex items-center gap-2">
						{translate("dashboard.routes.content.details.subtitle")}
						{isSaving && (
							<span className="text-xs text-amber-600">
								{translate("dashboard.routes.content.details.saving")}
							</span>
						)}
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<Button onClick={handleEdit} variant="outline" size="sm">
						<Edit className="size-4 mr-2" />
						{translate("common.actions.edit")}
					</Button>
					{content.status === "draft" && (
						<Button
							onClick={handlePublish}
							variant="outline"
							size="sm"
							disabled={publishMutation.isPending}
						>
							<Send className="size-4 mr-2" />
							{translate("common.actions.publish")}
						</Button>
					)}
					{content.status !== "archived" && (
						<Button
							onClick={handleArchive}
							variant="outline"
							size="sm"
							disabled={archiveMutation.isPending}
						>
							<Archive className="size-4 mr-2" />
							{translate("common.actions.archive")}
						</Button>
					)}
					<Button
						onClick={handleDelete}
						variant="outline"
						size="sm"
						className="text-destructive hover:text-destructive"
					>
						<Trash2 className="size-4 mr-2" />
						{translate("common.actions.delete")}
					</Button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PenLine className="size-5" />
							{translate("dashboard.routes.content.details.editor-title")}
						</CardTitle>
						<CardDescription>
							{translate("dashboard.routes.content.details.editor-description")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ContentEditor
							initialContent={content.body || ""}
							onChange={handleContentChange}
							placeholder={translate("dashboard.routes.content.details.editor-placeholder")}
							disabled={content.status === "archived"}
						/>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<ContentInfoCard
						content={content}
						slug={activeOrganization.slug}
					/>
					<ContentStatsCard
						stats={content.stats}
						body={content.body || ""}
					/>
				</div>
			</div>

			{/* Chat Sidebar */}
			<ChatSidebar contentId={contentId} />
		</main>
	);
}

export function ContentDetailsPage({ contentId }: ContentDetailsPageProps) {
	return (
		<ErrorBoundary FallbackComponent={ContentDetailsPageError}>
			<Suspense fallback={<ContentDetailsPageSkeleton />}>
				<ContentDetailsPageContent contentId={contentId} />
			</Suspense>
		</ErrorBoundary>
	);
}

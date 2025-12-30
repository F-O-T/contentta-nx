import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { TooltipProvider } from "@packages/ui/components/tooltip";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Archive, ArrowLeft, Send, Trash2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { ContentEditor } from "@/features/content/ui/content-editor";
import { ContentMetadataBar } from "@/features/content/ui/content-metadata-bar";
import { ContentFrontmatterPanel } from "@/features/content/ui/content-frontmatter-panel";
import { ChatSidebar } from "@/features/content/ui/chat-sidebar";
import {
	registerFrontmatterHandlers,
	unregisterFrontmatterHandlers,
} from "@/features/content/utils/frontmatter-tool-executor";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type ContentDetailsPageProps = {
	contentId: string;
};

function ContentDetailsPageSkeleton() {
	return (
		<div className="flex h-[calc(100vh-4rem)] -m-4">
			<main className="flex flex-1 flex-col overflow-hidden p-4">
				{/* Header */}
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-3">
						<Skeleton className="size-9" />
						<div>
							<Skeleton className="h-7 w-48" />
							<Skeleton className="h-4 w-64 mt-1" />
						</div>
					</div>
					<Skeleton className="h-6 w-20" />
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 mb-4">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
				</div>

				{/* Metadata Bar */}
				<div className="flex items-center gap-4 border-b pb-3 mb-4">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-16" />
				</div>

				{/* Editor */}
				<div className="flex-1">
					<Skeleton className="h-full w-full" />
				</div>
			</main>

			{/* Chat Sidebar */}
			<div className="w-80 shrink-0 border-l p-4">
				<Skeleton className="h-8 w-full mb-4" />
				<Skeleton className="h-[calc(100%-8rem)] w-full" />
				<Skeleton className="h-20 w-full mt-4" />
			</div>
		</div>
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
	const [isSaving, setIsSaving] = useState(false);
	const [isSavingMeta, setIsSavingMeta] = useState(false);

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

	const updateMetaMutation = useMutation(
		trpc.content.update.mutationOptions({
			onSuccess: () => {
				setIsSavingMeta(false);
				queryClient.invalidateQueries({
					queryKey: trpc.content.getById.queryKey({ id: contentId }),
				});
			},
			onError: (error) => {
				setIsSavingMeta(false);
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

	const handleMetaChange = useCallback(
		(metaUpdates: Partial<typeof content.meta>) => {
			setIsSavingMeta(true);
			updateMetaMutation.mutate({
				id: contentId,
				data: {
					meta: {
						...content.meta,
						...metaUpdates,
					},
				},
			});
		},
		[contentId, content.meta, updateMetaMutation],
	);

	// Register frontmatter handlers for agent tool execution
	useEffect(() => {
		registerFrontmatterHandlers({
			updateTitle: (title) => handleMetaChange({ title }),
			updateDescription: (description) => handleMetaChange({ description }),
			updateSlug: (slug) => handleMetaChange({ slug }),
			updateKeywords: (keywords) => handleMetaChange({ keywords }),
		});

		return () => {
			unregisterFrontmatterHandlers();
		};
	}, [handleMetaChange]);

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

	const STATUS_COLORS: Record<string, string> = {
		archived: "bg-slate-500/10 text-slate-600 border-slate-200",
		draft: "bg-amber-500/10 text-amber-600 border-amber-200",
		published: "bg-green-500/10 text-green-600 border-green-200",
	};

	return (
		<TooltipProvider>
			<div className="flex h-[calc(100vh-4rem)] -m-4">
				{/* Main Content */}
				<main className="flex flex-1 flex-col overflow-hidden p-4">
					{/* Header */}
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-3">
							<Button asChild size="icon" variant="ghost">
								<Link
									to="/$slug/content"
									params={{ slug: activeOrganization.slug }}
								>
									<ArrowLeft className="size-4" />
								</Link>
							</Button>
							<div>
								<h1 className="text-2xl font-bold">
									{content.meta.title || translate("common.labels.untitled")}
								</h1>
								<p className="text-muted-foreground text-sm flex items-center gap-2">
									{content.meta.description || translate("dashboard.routes.content.details.subtitle")}
									{isSaving && (
										<span className="text-xs text-amber-600">
											{translate("dashboard.routes.content.details.saving")}
										</span>
									)}
								</p>
							</div>
						</div>
						<Badge className={STATUS_COLORS[content.status]} variant="outline">
							{content.status}
						</Badge>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2 mb-4">
						<Button
							onClick={handleDelete}
							variant="outline"
							size="sm"
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="size-4 mr-2" />
							{translate("common.actions.delete")}
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
					</div>

					{/* Frontmatter Panel */}
					<ContentFrontmatterPanel
						contentId={contentId}
						meta={content.meta}
						body={content.body || ""}
						onMetaChange={handleMetaChange}
						isSaving={isSavingMeta}
						disabled={content.status === "archived"}
						className="mb-4"
					/>

					{/* Metadata Bar */}
					<ContentMetadataBar
						content={content}
						slug={activeOrganization.slug}
						className="mb-4"
					/>

					{/* Editor - fills remaining space */}
					<div className="flex-1 overflow-hidden min-h-0">
						<ContentEditor
							initialContent={content.body || ""}
							onChange={handleContentChange}
							placeholder={translate("dashboard.routes.content.details.editor-placeholder")}
							disabled={content.status === "archived"}
							className="h-full"
						/>
					</div>
				</main>

				{/* Chat Sidebar */}
				<ChatSidebar
					contentId={contentId}
					contentMeta={{
						title: content.meta.title,
						description: content.meta.description,
						slug: content.meta.slug,
						keywords: content.meta.keywords,
						status: content.status,
					}}
				/>
			</div>
		</TooltipProvider>
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

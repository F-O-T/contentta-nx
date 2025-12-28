import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import {
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { FC, FormEvent } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type Content = {
	id: string;
	agentId: string;
	meta: {
		title: string;
		description: string;
		slug: string;
		keywords?: string[];
		sources?: string[];
	};
};

type ManageContentFormProps = {
	content?: Content;
	agentId?: string;
};

function ManageContentErrorFallback() {
	return (
		<Alert variant="destructive">
			<AlertTriangle className="h-4 w-4" />
			<AlertDescription>
				{translate("common.errors.default")}
			</AlertDescription>
		</Alert>
	);
}

function ManageContentSkeleton() {
	return (
		<div className="grid gap-4 px-4">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-20 w-full" />
			<div className="flex gap-2 pt-4">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}

function ManageContentFormContent({ content, agentId }: ManageContentFormProps) {
	const { closeSheet } = useSheet();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const isEditMode = !!content;

	const { data: writersData } = useSuspenseQuery(
		trpc.agent.list.queryOptions({ limit: 100, page: 1 }),
	);

	const writers = writersData.items;

	const createMutation = useMutation(
		trpc.content.create.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.form.create-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
				closeSheet();
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.content.update.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.content.form.update-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
				if (content?.id) {
					queryClient.invalidateQueries({
						queryKey: trpc.content.getById.queryKey({ id: content.id }),
					});
				}
				closeSheet();
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const isPending = createMutation.isPending || updateMutation.isPending;

	const schema = z.object({
		agentId: z.string().uuid(translate("dashboard.routes.content.form.writer-required")),
		title: z
			.string()
			.min(1, translate("dashboard.routes.content.form.title-required"))
			.max(200, translate("dashboard.routes.content.form.title-max")),
		description: z
			.string()
			.min(1, translate("dashboard.routes.content.form.description-required"))
			.max(500, translate("dashboard.routes.content.form.description-max")),
		slug: z
			.string()
			.min(1, translate("dashboard.routes.content.form.slug-required"))
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, translate("dashboard.routes.content.form.slug-invalid")),
	});

	const form = useForm({
		defaultValues: {
			agentId: content?.agentId ?? agentId ?? "",
			title: content?.meta.title ?? "",
			description: content?.meta.description ?? "",
			slug: content?.meta.slug ?? "",
		},
		onSubmit: async ({ value }) => {
			const meta = {
				title: value.title,
				description: value.description,
				slug: value.slug,
			};

			if (isEditMode && content) {
				updateMutation.mutate({
					id: content.id,
					data: { meta },
				});
			} else {
				createMutation.mutate({
					agentId: value.agentId,
					meta,
				});
			}
		},
		validators: {
			onBlur: schema as unknown as undefined,
		},
	});

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		form.handleSubmit();
	};

	// Auto-generate slug from title
	const handleTitleChange = (title: string) => {
		const slugValue = form.getFieldValue("slug");
		// Only auto-generate if slug is empty or was auto-generated
		if (!slugValue || slugValue === generateSlug(form.getFieldValue("title") ?? "")) {
			form.setFieldValue("slug", generateSlug(title));
		}
	};

	const generateSlug = (text: string) => {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	};

	return (
		<>
			<form className="grid gap-4 px-4 overflow-y-auto" onSubmit={handleSubmit}>
				{!isEditMode && (
					<form.Field name="agentId">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{translate("dashboard.routes.content.form.writer")}
									</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={translate("dashboard.routes.content.form.writer-placeholder")}
											/>
										</SelectTrigger>
										<SelectContent>
											{writers.map((writer) => (
												<SelectItem key={writer.id} value={writer.id}>
													{writer.personaConfig.metadata.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				)}

				<form.Field name="title">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.content.form.title")}
								</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										handleTitleChange(e.target.value);
									}}
									placeholder={translate("dashboard.routes.content.form.title-placeholder")}
									type="text"
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="slug">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.content.form.slug")}
								</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.content.form.slug-placeholder")}
									type="text"
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="description">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.content.form.description")}
								</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.content.form.description-placeholder")}
									rows={3}
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
			</form>

			<SheetFooter>
				<Button onClick={closeSheet} type="button" variant="outline">
					{translate("common.actions.cancel")}
				</Button>
				<form.Subscribe>
					{(formState) => (
						<Button
							disabled={!formState.canSubmit || formState.isSubmitting || isPending}
							onClick={() => form.handleSubmit()}
							type="submit"
						>
							{isPending
								? isEditMode
									? translate("dashboard.routes.content.form.saving")
									: translate("dashboard.routes.content.form.creating")
								: isEditMode
									? translate("dashboard.routes.content.form.save")
									: translate("dashboard.routes.content.form.create")}
						</Button>
					)}
				</form.Subscribe>
			</SheetFooter>
		</>
	);
}

export const ManageContentForm: FC<ManageContentFormProps> = ({ content, agentId }) => {
	const isEditMode = !!content;

	return (
		<>
			<SheetHeader>
				<SheetTitle>
					{isEditMode
						? translate("dashboard.routes.content.form.edit-title")
						: translate("dashboard.routes.content.form.create-title")}
				</SheetTitle>
				<SheetDescription>
					{isEditMode
						? translate("dashboard.routes.content.form.edit-description")
						: translate("dashboard.routes.content.form.create-description")}
				</SheetDescription>
			</SheetHeader>
			<ErrorBoundary FallbackComponent={ManageContentErrorFallback}>
				<Suspense fallback={<ManageContentSkeleton />}>
					<ManageContentFormContent content={content} agentId={agentId} />
				</Suspense>
			</ErrorBoundary>
		</>
	);
};

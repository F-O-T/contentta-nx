import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { FC, FormEvent } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { WriterPhotoUpload } from "./writer-photo-upload";

type Writer = {
	id: string;
	personaConfig: {
		metadata: {
			name: string;
			description?: string;
		};
		instructions?: {
			writingGuidelines?: string;
			audienceProfile?: string;
			tone?: string;
			style?: string;
		};
	};
	profilePhotoUrl?: string | null;
};

type ManageWriterFormProps = {
	writer?: Writer;
};

function ManageWriterErrorFallback() {
	return (
		<Alert variant="destructive">
			<AlertTriangle className="h-4 w-4" />
			<AlertDescription>
				{translate("common.errors.default")}
			</AlertDescription>
		</Alert>
	);
}

function ManageWriterSkeleton() {
	return (
		<div className="grid gap-4 px-4">
			<div className="flex justify-center">
				<Skeleton className="size-16 rounded-full" />
			</div>
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-20 w-full" />
			<div className="flex gap-2 pt-4">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}

function ManageWriterFormContent({ writer }: ManageWriterFormProps) {
	const { closeSheet } = useSheet();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const isEditMode = !!writer;

	const createMutation = useMutation(
		trpc.agent.create.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.writers.form.create-success"));
				queryClient.invalidateQueries({ queryKey: trpc.agent.list.queryKey() });
				queryClient.invalidateQueries({ queryKey: trpc.agent.getStats.queryKey() });
				closeSheet();
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.agent.update.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.writers.form.update-success"));
				queryClient.invalidateQueries({ queryKey: trpc.agent.list.queryKey() });
				if (writer?.id) {
					queryClient.invalidateQueries({
						queryKey: trpc.agent.getById.queryKey({ id: writer.id }),
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
		name: z
			.string()
			.min(1, translate("dashboard.routes.writers.form.name-required"))
			.max(50, translate("dashboard.routes.writers.form.name-max")),
		description: z
			.string()
			.max(200, translate("dashboard.routes.writers.form.description-max"))
			.optional(),
	});

	const form = useForm({
		defaultValues: {
			name: writer?.personaConfig.metadata.name ?? "",
			description: writer?.personaConfig.metadata.description ?? "",
		},
		onSubmit: async ({ value }) => {
			const personaConfig = {
				metadata: {
					name: value.name,
					description: value.description || undefined,
				},
				instructions: {
					// Preserve existing instructions in edit mode
					...(writer?.personaConfig.instructions || {}),
					ragIntegration: true,
				},
			};

			if (isEditMode && writer) {
				updateMutation.mutate({
					id: writer.id,
					data: { personaConfig },
				});
			} else {
				createMutation.mutate({ personaConfig });
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

	return (
		<>
			<form className="grid gap-6 px-4 overflow-y-auto" onSubmit={handleSubmit}>
				{/* Photo Upload - only show for edit mode */}
				{isEditMode && writer && (
					<div className="flex justify-center">
						<WriterPhotoUpload
							agentId={writer.id}
							currentPhotoUrl={writer.profilePhotoUrl}
							name={writer.personaConfig.metadata.name}
							size="lg"
						/>
					</div>
				)}

				<form.Field name="name">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.writers.form.name")}
								</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.writers.form.name-placeholder")}
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
									{translate("dashboard.routes.writers.form.description")}
								</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.writers.form.description-placeholder")}
									rows={3}
									value={field.state.value}
								/>
								<FieldDescription>
									{translate("dashboard.routes.writers.form.description-hint")}
								</FieldDescription>
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
									? translate("dashboard.routes.writers.form.saving")
									: translate("dashboard.routes.writers.form.creating")
								: isEditMode
									? translate("dashboard.routes.writers.form.save")
									: translate("dashboard.routes.writers.form.create")}
						</Button>
					)}
				</form.Subscribe>
			</SheetFooter>
		</>
	);
}

export const ManageWriterForm: FC<ManageWriterFormProps> = ({ writer }) => {
	const isEditMode = !!writer;

	return (
		<>
			<SheetHeader>
				<SheetTitle>
					{isEditMode
						? translate("dashboard.routes.writers.form.edit-title")
						: translate("dashboard.routes.writers.form.create-title")}
				</SheetTitle>
				<SheetDescription>
					{isEditMode
						? translate("dashboard.routes.writers.form.edit-description")
						: translate("dashboard.routes.writers.form.create-description")}
				</SheetDescription>
			</SheetHeader>
			<ErrorBoundary FallbackComponent={ManageWriterErrorFallback}>
				<Suspense fallback={<ManageWriterSkeleton />}>
					<ManageWriterFormContent writer={writer} />
				</Suspense>
			</ErrorBoundary>
		</>
	);
};

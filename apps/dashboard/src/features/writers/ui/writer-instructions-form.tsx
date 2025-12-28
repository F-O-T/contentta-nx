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

type WriterInstructions = {
	tone?: string;
	style?: string;
	audienceProfile?: string;
	writingGuidelines?: string;
};

type WriterInstructionsFormProps = {
	writerId: string;
	writerName: string;
	instructions?: WriterInstructions;
};

function WriterInstructionsErrorFallback() {
	return (
		<Alert variant="destructive">
			<AlertTriangle className="h-4 w-4" />
			<AlertDescription>
				{translate("common.errors.default")}
			</AlertDescription>
		</Alert>
	);
}

function WriterInstructionsSkeleton() {
	return (
		<div className="grid gap-4 px-4">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-4 w-28" />
			<Skeleton className="h-20 w-full" />
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-20 w-full" />
			<div className="flex gap-2 pt-4">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}

function WriterInstructionsFormContent({
	writerId,
	writerName,
	instructions,
}: WriterInstructionsFormProps) {
	const { closeSheet } = useSheet();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const updateMutation = useMutation(
		trpc.agent.update.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.writers.form.instructions-success"));
				queryClient.invalidateQueries({
					queryKey: trpc.agent.getById.queryKey({ id: writerId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.agent.list.queryKey(),
				});
				closeSheet();
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

	const schema = z.object({
		tone: z.string().max(100).optional(),
		style: z.string().max(100).optional(),
		audienceProfile: z.string().max(500).optional(),
		writingGuidelines: z.string().max(2000).optional(),
	});

	const form = useForm({
		defaultValues: {
			tone: instructions?.tone ?? "",
			style: instructions?.style ?? "",
			audienceProfile: instructions?.audienceProfile ?? "",
			writingGuidelines: instructions?.writingGuidelines ?? "",
		},
		onSubmit: async ({ value }) => {
			updateMutation.mutate({
				id: writerId,
				data: {
					personaConfig: {
						metadata: {
							name: writerName,
						},
						instructions: {
							tone: value.tone || undefined,
							style: value.style || undefined,
							audienceProfile: value.audienceProfile || undefined,
							writingGuidelines: value.writingGuidelines || undefined,
							ragIntegration: true,
						},
					},
				},
			});
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

	const isPending = updateMutation.isPending;

	return (
		<>
			<form className="grid gap-6 px-4 overflow-y-auto" onSubmit={handleSubmit}>
				<form.Field name="tone">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.writers.form.tone")}
								</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.writers.form.tone-placeholder")}
									type="text"
									value={field.state.value}
								/>
								<FieldDescription>
									{translate("dashboard.routes.writers.form.tone-hint")}
								</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="style">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.writers.form.style")}
								</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.writers.form.style-placeholder")}
									type="text"
									value={field.state.value}
								/>
								<FieldDescription>
									{translate("dashboard.routes.writers.form.style-hint")}
								</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="audienceProfile">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.writers.form.audience")}
								</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.writers.form.audience-placeholder")}
									rows={3}
									value={field.state.value}
								/>
								<FieldDescription>
									{translate("dashboard.routes.writers.form.audience-hint")}
								</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="writingGuidelines">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.writers.form.guidelines")}
								</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={translate("dashboard.routes.writers.form.guidelines-placeholder")}
									rows={5}
									value={field.state.value}
								/>
								<FieldDescription>
									{translate("dashboard.routes.writers.form.guidelines-hint")}
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
								? translate("dashboard.routes.writers.form.saving")
								: translate("dashboard.routes.writers.form.save")}
						</Button>
					)}
				</form.Subscribe>
			</SheetFooter>
		</>
	);
}

export const WriterInstructionsForm: FC<WriterInstructionsFormProps> = ({
	writerId,
	writerName,
	instructions,
}) => {
	return (
		<>
			<SheetHeader>
				<SheetTitle>
					{translate("dashboard.routes.writers.form.instructions-title")}
				</SheetTitle>
				<SheetDescription>
					{translate("dashboard.routes.writers.form.instructions-description")}
				</SheetDescription>
			</SheetHeader>
			<ErrorBoundary FallbackComponent={WriterInstructionsErrorFallback}>
				<Suspense fallback={<WriterInstructionsSkeleton />}>
					<WriterInstructionsFormContent
						instructions={instructions}
						writerId={writerId}
						writerName={writerName}
					/>
				</Suspense>
			</ErrorBoundary>
		</>
	);
};

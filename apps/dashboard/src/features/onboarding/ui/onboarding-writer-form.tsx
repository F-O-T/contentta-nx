import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";

type OnboardingWriterFormProps = {
	onSuccess: () => void;
};

export function OnboardingWriterForm({ onSuccess }: OnboardingWriterFormProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const createMutation = useMutation(
		trpc.agent.create.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.writers.form.create-success"));
				queryClient.invalidateQueries({ queryKey: trpc.agent.list.queryKey() });
				queryClient.invalidateQueries({ queryKey: trpc.agent.getStats.queryKey() });
				onSuccess();
			},
			onError: (error) => {
				toast.error(error.message || translate("common.errors.default"));
			},
		}),
	);

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
			name: "",
			description: "",
		},
		onSubmit: async ({ value }) => {
			const personaConfig = {
				metadata: {
					name: value.name,
					description: value.description || undefined,
				},
				instructions: {
					ragIntegration: true,
				},
			};

			createMutation.mutate({ personaConfig });
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
		<form className="space-y-6" onSubmit={handleSubmit}>
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

			<form.Subscribe>
				{(formState) => (
					<Button
						className="w-full gap-2"
						disabled={!formState.canSubmit || formState.isSubmitting || createMutation.isPending}
						size="lg"
						type="submit"
					>
						{createMutation.isPending ? (
							<>
								<Loader2Icon className="size-4 animate-spin" />
								{translate("dashboard.routes.writers.form.creating")}
							</>
						) : (
							<>
								{translate("dashboard.routes.onboarding.writer.action")}
								<ChevronRightIcon className="size-4" />
							</>
						)}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

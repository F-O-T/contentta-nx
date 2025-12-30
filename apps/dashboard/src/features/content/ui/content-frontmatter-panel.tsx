"use client";

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import {
	ChevronDown,
	ChevronUp,
	Loader2,
	RefreshCw,
	Sparkles,
	Wand2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { KeywordsInput } from "./keywords-input";
import { useMetaGeneration } from "../hooks/use-meta-generation";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type ContentMeta = {
	title: string;
	description: string;
	slug: string;
	keywords?: string[];
	sources?: string[];
};

type ContentFrontmatterPanelProps = {
	contentId: string;
	meta: ContentMeta;
	body: string;
	onMetaChange: (meta: Partial<ContentMeta>) => void;
	isSaving?: boolean;
	disabled?: boolean;
	className?: string;
};

const metaSchema = z.object({
	title: z.string().min(1, "Title is required").max(200, "Title is too long"),
	description: z.string().max(500, "Description is too long"),
	slug: z
		.string()
		.min(1, "Slug is required")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Slug must be lowercase with hyphens only",
		),
	keywords: z.array(z.string()).max(10, "Maximum 10 keywords allowed"),
});

export function ContentFrontmatterPanel({
	contentId,
	meta,
	body,
	onMetaChange,
	isSaving = false,
	disabled = false,
	className,
}: ContentFrontmatterPanelProps) {
	const [isOpen, setIsOpen] = useState(true);
	const {
		generateDescription,
		generateKeywords,
		generateAll,
		generateSlugFromTitle,
		isGeneratingDescription,
		isGeneratingKeywords,
		isGeneratingAll,
	} = useMetaGeneration({
		onError: (error) => {
			toast.error(error.message || translate("common.errors.default"));
		},
	});

	const form = useForm({
		defaultValues: {
			title: meta.title ?? "",
			description: meta.description ?? "",
			slug: meta.slug ?? "",
			keywords: meta.keywords ?? [],
		},
		validators: {
			onBlur: metaSchema as unknown as undefined,
		},
	});

	// Sync form with external meta changes
	useEffect(() => {
		form.setFieldValue("title", meta.title ?? "");
		form.setFieldValue("description", meta.description ?? "");
		form.setFieldValue("slug", meta.slug ?? "");
		form.setFieldValue("keywords", meta.keywords ?? []);
	}, [contentId]);

	// Debounced save callback
	const debouncedSave = useDebouncedCallback(
		(updates: Partial<ContentMeta>) => {
			onMetaChange(updates);
		},
		1000,
	);

	// Handle field changes with auto-save
	const handleFieldChange = useCallback(
		(field: "title" | "description" | "slug" | "keywords", value: string | string[]) => {
			form.setFieldValue(field, value as never);
			debouncedSave({ [field]: value });
		},
		[form, debouncedSave],
	);

	// Auto-generate slug from title
	const handleTitleChange = useCallback(
		(title: string) => {
			form.setFieldValue("title", title);
			const currentSlug = form.getFieldValue("slug");
			const expectedSlug = generateSlugFromTitle(
				form.getFieldValue("title") ?? "",
			);

			// Only auto-generate if slug is empty or was auto-generated
			if (!currentSlug || currentSlug === expectedSlug) {
				const newSlug = generateSlugFromTitle(title);
				form.setFieldValue("slug", newSlug);
				debouncedSave({ title, slug: newSlug });
			} else {
				debouncedSave({ title });
			}
		},
		[form, generateSlugFromTitle, debouncedSave],
	);

	// Regenerate slug from current title
	const handleRegenerateSlug = useCallback(() => {
		const title = form.getFieldValue("title") ?? "";
		const newSlug = generateSlugFromTitle(title);
		form.setFieldValue("slug", newSlug);
		debouncedSave({ slug: newSlug });
	}, [form, generateSlugFromTitle, debouncedSave]);

	// AI generation handlers
	const handleGenerateDescription = useCallback(async () => {
		const title = form.getFieldValue("title") ?? "";
		if (!title || !body) {
			toast.error("Title and content are required to generate description");
			return;
		}
		const description = await generateDescription(title, body);
		if (description) {
			form.setFieldValue("description", description);
			debouncedSave({ description });
			toast.success("Description generated");
		}
	}, [form, body, generateDescription, debouncedSave]);

	const handleGenerateKeywords = useCallback(async () => {
		const title = form.getFieldValue("title") ?? "";
		if (!title || !body) {
			toast.error("Title and content are required to generate keywords");
			return;
		}
		const keywords = await generateKeywords(title, body);
		if (keywords) {
			form.setFieldValue("keywords", keywords);
			debouncedSave({ keywords });
			toast.success("Keywords generated");
		}
	}, [form, body, generateKeywords, debouncedSave]);

	const handleGenerateAll = useCallback(async () => {
		const title = form.getFieldValue("title") ?? "";
		if (!title || !body) {
			toast.error("Title and content are required to generate metadata");
			return;
		}
		const result = await generateAll(title, body);
		if (result) {
			if (result.description) {
				form.setFieldValue("description", result.description);
			}
			if (result.keywords) {
				form.setFieldValue("keywords", result.keywords);
			}
			debouncedSave({
				description: result.description,
				keywords: result.keywords,
			});
			toast.success("Metadata generated");
		}
	}, [form, body, generateAll, debouncedSave]);

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className={cn("border rounded-md bg-muted/30", className)}
		>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
				>
					<div className="flex items-center gap-2">
						<span>Frontmatter</span>
						{isSaving && (
							<span className="text-xs text-amber-600 flex items-center gap-1">
								<Loader2 className="size-3 animate-spin" />
								{translate("dashboard.routes.content.details.saving")}
							</span>
						)}
					</div>
					{isOpen ? (
						<ChevronUp className="size-4 text-muted-foreground" />
					) : (
						<ChevronDown className="size-4 text-muted-foreground" />
					)}
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent className="px-4 pb-4 space-y-4">
				{/* Title Field */}
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
									onChange={(e) => handleTitleChange(e.target.value)}
									placeholder={translate(
										"dashboard.routes.content.form.title-placeholder",
									)}
									type="text"
									value={field.state.value}
									disabled={disabled}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				{/* Slug Field */}
				<form.Field name="slug">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{translate("dashboard.routes.content.form.slug")}
								</FieldLabel>
								<div className="flex gap-2">
									<Input
										aria-invalid={isInvalid}
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e) =>
											handleFieldChange("slug", e.target.value)
										}
										placeholder={translate(
											"dashboard.routes.content.form.slug-placeholder",
										)}
										type="text"
										value={field.state.value}
										disabled={disabled}
										className="flex-1 font-mono text-sm"
									/>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={handleRegenerateSlug}
												disabled={disabled}
											>
												<RefreshCw className="size-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Regenerate from title</TooltipContent>
									</Tooltip>
								</div>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				{/* Description Field */}
				<form.Field name="description">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<div className="flex items-center justify-between">
									<FieldLabel htmlFor={field.name}>
										{translate("dashboard.routes.content.form.description")}
									</FieldLabel>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={handleGenerateDescription}
												disabled={disabled || isGeneratingDescription}
												className="h-6 text-xs gap-1"
											>
												{isGeneratingDescription ? (
													<Loader2 className="size-3 animate-spin" />
												) : (
													<Sparkles className="size-3" />
												)}
												Generate
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Generate description with AI
										</TooltipContent>
									</Tooltip>
								</div>
								<Textarea
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) =>
										handleFieldChange("description", e.target.value)
									}
									placeholder={translate(
										"dashboard.routes.content.form.description-placeholder",
									)}
									rows={2}
									value={field.state.value}
									disabled={disabled}
								/>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>SEO meta description</span>
									<span>{field.state.value?.length ?? 0}/160</span>
								</div>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				{/* Keywords Field */}
				<form.Field name="keywords">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<div className="flex items-center justify-between">
									<FieldLabel>Keywords</FieldLabel>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={handleGenerateKeywords}
												disabled={disabled || isGeneratingKeywords}
												className="h-6 text-xs gap-1"
											>
												{isGeneratingKeywords ? (
													<Loader2 className="size-3 animate-spin" />
												) : (
													<Sparkles className="size-3" />
												)}
												Generate
											</Button>
										</TooltipTrigger>
										<TooltipContent>Generate keywords with AI</TooltipContent>
									</Tooltip>
								</div>
								<KeywordsInput
									value={field.state.value ?? []}
									onChange={(keywords) =>
										handleFieldChange("keywords", keywords)
									}
									placeholder="Add keyword..."
									disabled={disabled}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				{/* Generate All Button */}
				<div className="pt-2 border-t">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleGenerateAll}
						disabled={disabled || isGeneratingAll}
						className="w-full gap-2"
					>
						{isGeneratingAll ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Wand2 className="size-4" />
						)}
						Generate All Metadata with AI
					</Button>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

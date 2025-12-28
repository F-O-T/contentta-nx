import { z } from "zod";

// Content-related schemas and types (extracted from database package)
export const ContentStatsSchema = z.object({
	wordsCount: z
		.string()
		.optional()
		.describe("The number of words in the content."),
	readTimeMinutes: z
		.string()
		.optional()
		.describe("Estimated reading time in minutes."),
	qualityScore: z
		.string()
		.optional()
		.describe("A score representing the quality of the content."),
});

export const ContentMetaSchema = z.object({
	title: z.string().optional().describe("The title of the content."),
	description: z
		.string()
		.optional()
		.describe("A brief seo optmized description of the content."),
	keywords: z
		.array(z.string())
		.optional()
		.describe("SEO optimized keywords associated with the content."),
	slug: z
		.string()
		.optional()
		.describe("A URL-friendly identifier for the content."),
	sources: z
		.array(z.string())
		.optional()
		.describe("Sources or references used in the content."),
});

export const ContentRequestSchema = z.object({
	description: z.string().min(1, "Description is required"),
	layout: z.enum(["tutorial", "article", "changelog"]),
});

// Content status enum values
export const ContentStatusValues = ["draft", "approved"] as const;

// Share status enum values
export const ShareStatusValues = ["private", "shared"] as const;

export const VoiceConfigSchema = z.object({
	communication: z.enum(["first_person", "third_person"]),
});

// 2. Audience
export const AudienceConfigSchema = z.object({
	base: z.enum(["general_public", "professionals", "beginners", "customers"]),
});

// 3. Format & Structure
export const FormatConfigSchema = z.object({
	style: z.enum(["structured", "narrative", "list_based"]),
	listStyle: z.enum(["bullets", "numbered"]).optional(),
});

// 4. Language
export const LanguageConfigSchema = z.object({
	primary: z.enum(["en", "pt", "es"]),
	variant: z
		.enum(["en-US", "en-GB", "pt-BR", "pt-PT", "es-ES", "es-MX"])
		.optional(),
});

// 5. Brand Asset Bundle
export const BrandConfigSchema = z.object({
	integrationStyle: z.enum([
		"strict_guideline",
		"flexible_guideline",
		"reference_only",
		"creative_blend",
	]),
	blacklistWords: z.string().optional(),
});

// 6. Repurposing — strongly-typed channels
export const PurposeChannelSchema = z.enum(["blog_post"]);

export const PersonaConfigSchema = z.object({
	metadata: z.object({
		name: z.string().min(1, "This field is required"),
		description: z.string().min(1, "This field is required"),
	}),
	voice: VoiceConfigSchema.partial().optional(),
	audience: AudienceConfigSchema.partial().optional(),
	formatting: FormatConfigSchema.partial().optional(),
	language: LanguageConfigSchema.partial().optional(),
	brand: BrandConfigSchema.partial().optional(),
	purpose: PurposeChannelSchema.optional(),
});
// Input schemas for API calls
const ContentStatusSchema = z.enum(ContentStatusValues, {
	message: "Invalid content status. Must be one of: draft, approved.",
});

export const ListContentByAgentInputSchema = z.object({
	status: z
		.union([ContentStatusSchema, z.array(ContentStatusSchema)])
		.optional()
		.transform((value) => {
			if (!value) return undefined;
			return Array.isArray(value) ? value : [value];
		}),
	agentId: z.string().min(1, "Agent ID is required."),
	limit: z.coerce.number().min(1).max(100).optional(),
	page: z.coerce.number().min(1).optional(),
});

export const GetContentBySlugInputSchema = z.object({
	slug: z.string().min(1, "Slug is required."),
	agentId: z.string().min(1, "Agent ID is required."),
});

export const StreamAssistantResponseInputSchema = z.object({
	message: z.string().min(1, "Message is required"),
});
export const StreamAssistantResponseOutputSchema = z.string();
export const LocaleSchema = z.enum(["en-US", "pt-BR"]);
export type Locale = z.infer<typeof LocaleSchema>;
// Reusable image schema for SDK responses
export const ImageSchema = z
	.object({
		data: z.string(),
		contentType: z.string(),
	})
	.nullable();

// Author schema for getAuthorByAgentId
export const AuthorByAgentIdSchema = z.object({
	name: z.string(),
	profilePhoto: ImageSchema,
});

// Content select schema and type (agent removed)
export const ContentSelectSchema = z.object({
	id: z.string(),
	agentId: z.string(),
	imageUrl: z.string().nullable(),
	body: z.string(),
	status: z.enum(ContentStatusValues),
	shareStatus: z.enum(ShareStatusValues),
	meta: ContentMetaSchema,
	request: ContentRequestSchema,
	stats: ContentStatsSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	image: ImageSchema,
});

export const ContentListResponseSchema = z.object({
	posts: ContentSelectSchema.pick({
		id: true,
		meta: true,
		imageUrl: true,
		status: true,
		shareStatus: true,
		createdAt: true,
		stats: true,
	})
		.extend({
			image: ImageSchema,
		})
		.array(),
	total: z.number(),
});
export type ContentList = z.infer<typeof ContentListResponseSchema>;
// Related slugs response schema
export const RelatedSlugsResponseSchema = z.array(z.string());

// Exported types
export type ContentStats = z.infer<typeof ContentStatsSchema>;
export type ContentMeta = z.infer<typeof ContentMetaSchema>;
export type ContentRequest = z.infer<typeof ContentRequestSchema>;
export type ContentStatus = (typeof ContentStatusValues)[number];
export type ShareStatus = (typeof ShareStatusValues)[number];
export type ContentSelect = z.infer<typeof ContentSelectSchema>;
export type RelatedSlugsResponse = z.infer<typeof RelatedSlugsResponseSchema>;
export type Image = z.infer<typeof ImageSchema>;

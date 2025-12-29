import { z } from "zod";

// ============================================================================
// Trigger Types
// ============================================================================

/**
 * FIM Trigger Type Schema
 * Defines what event triggered the FIM completion
 */
export const FIMTriggerTypeSchema = z.enum([
	"debounce", // 500ms pause after typing
	"keystroke", // Immediate on certain keystrokes
	"cursor-move", // Selection/cursor change
	"punctuation", // After . ! ?
	"newline", // After Enter/paragraph
	"chain", // After accepting previous suggestion
	"edit-prediction", // Smart edit prediction based on context
]);

export type FIMTriggerType = z.infer<typeof FIMTriggerTypeSchema>;

// ============================================================================
// Confidence Scoring
// ============================================================================

/**
 * Confidence Factors Schema
 * Individual scoring components for confidence calculation
 */
export const FIMConfidenceFactorsSchema = z.object({
	length: z.number().min(0).max(1), // Based on suggestion length
	prefixSimilarity: z.number().min(0).max(1), // How well it flows from context
	stopReason: z.number().min(0).max(1), // Natural stop vs token limit
	latency: z.number().min(0).max(1), // Response time score
	repetition: z.number().min(0).max(1), // 0 = all repetition, 1 = no repetition
});

export type FIMConfidenceFactors = z.infer<typeof FIMConfidenceFactorsSchema>;

/**
 * Confidence Result Schema
 * Full confidence scoring result with factors breakdown
 */
export const FIMConfidenceResultSchema = z.object({
	score: z.number().min(0).max(1),
	factors: FIMConfidenceFactorsSchema,
	shouldShow: z.boolean(),
});

export type FIMConfidenceResult = z.infer<typeof FIMConfidenceResultSchema>;

// ============================================================================
// Diff Suggestions
// ============================================================================

/**
 * Diff Suggestion Schema
 * Represents either an insertion or replacement suggestion
 */
export const FIMDiffSuggestionSchema = z.object({
	type: z.enum(["insert", "replace"]),
	original: z.string().optional(), // Text being replaced (for "replace" type)
	suggestion: z.string(),
	replaceRange: z
		.object({
			start: z.number(),
			end: z.number(),
		})
		.optional(),
});

export type FIMDiffSuggestion = z.infer<typeof FIMDiffSuggestionSchema>;

// ============================================================================
// Stop Reason
// ============================================================================

export const FIMStopReasonSchema = z.enum([
	"natural",
	"token_limit",
	"stop_sequence",
]);

export type FIMStopReason = z.infer<typeof FIMStopReasonSchema>;

// ============================================================================
// Edit Intent Types
// ============================================================================

/**
 * Edit Intent Type Schema
 * Classifies the user's editing intention
 */
export const EditIntentTypeSchema = z.enum([
	"continuation", // User is continuing to write at end
	"insertion", // User is inserting text mid-document
	"correction", // User is correcting/fixing text
	"completion", // User is completing an incomplete thought
]);

export type EditIntentType = z.infer<typeof EditIntentTypeSchema>;

/**
 * Edit Context Schema
 * Additional context for edit predictions
 */
export const EditContextSchema = z.object({
	intent: EditIntentTypeSchema,
	cursorDistanceFromEnd: z.number().min(0).max(1),
	isInEditingMode: z.boolean(),
	isAfterIncomplete: z.boolean().optional(),
	hasSentencePattern: z.boolean().optional(),
});

export type EditContext = z.infer<typeof EditContextSchema>;

// ============================================================================
// FIM Request
// ============================================================================

/**
 * FIM Request Schema
 * Used to validate input for FIM completion requests
 */
export const FIMRequestSchema = z.object({
	prefix: z.string().min(1, "Prefix is required for completion"),
	suffix: z.string().default(""),
	contextType: z.enum(["document", "code"]).default("document"),
	maxTokens: z.number().min(1).max(256).default(64),
	temperature: z.number().min(0).max(1).default(0.3),
	stopSequences: z.array(z.string()).default(["\n\n", "."]),
	// New fields for enhanced FIM
	triggerType: FIMTriggerTypeSchema.optional(),
	recentText: z.string().optional(), // Last ~100 chars for repetition detection
	cursorContext: z
		.object({
			isEndOfParagraph: z.boolean(),
			isEndOfSentence: z.boolean(),
			isAfterPunctuation: z.boolean(),
		})
		.optional(),
	// Edit prediction context
	editContext: EditContextSchema.optional(),
});

export type FIMRequest = z.infer<typeof FIMRequestSchema>;

/**
 * FIM Response Schema (for non-streaming)
 */
export const FIMResponseSchema = z.object({
	completion: z.string(),
	finishReason: z.enum(["stop", "length", "content_filter"]).optional(),
});

export type FIMResponse = z.infer<typeof FIMResponseSchema>;

/**
 * FIM Streaming Chunk Schema (Basic)
 */
export const FIMChunkSchema = z.object({
	text: z.string(),
	done: z.boolean().default(false),
});

export type FIMChunk = z.infer<typeof FIMChunkSchema>;

/**
 * FIM Chunk Metadata Schema
 * Enhanced metadata returned with final chunk
 */
export const FIMChunkMetadataSchema = z.object({
	stopReason: FIMStopReasonSchema.optional(),
	latencyMs: z.number().optional(),
	confidence: z.number().min(0).max(1).optional(),
	shouldShow: z.boolean().optional(),
	factors: FIMConfidenceFactorsSchema.optional(),
});

export type FIMChunkMetadata = z.infer<typeof FIMChunkMetadataSchema>;

/**
 * FIM Streaming Chunk Schema (Enhanced with metadata)
 */
export const FIMChunkEnhancedSchema = z.object({
	text: z.string(),
	done: z.boolean().default(false),
	metadata: FIMChunkMetadataSchema.optional(),
});

export type FIMChunkEnhanced = z.infer<typeof FIMChunkEnhancedSchema>;

// Re-export schemas and types
export {
	FIMRequestSchema,
	FIMResponseSchema,
	FIMChunkSchema,
	FIMChunkEnhancedSchema,
	FIMChunkMetadataSchema,
	FIMTriggerTypeSchema,
	FIMConfidenceFactorsSchema,
	FIMConfidenceResultSchema,
	FIMDiffSuggestionSchema,
	FIMStopReasonSchema,
	EditIntentTypeSchema,
	EditContextSchema,
	type FIMRequest,
	type FIMResponse,
	type FIMChunk,
	type FIMChunkEnhanced,
	type FIMChunkMetadata,
	type FIMTriggerType,
	type FIMConfidenceFactors,
	type FIMConfidenceResult,
	type FIMDiffSuggestion,
	type FIMStopReason,
	type EditIntentType,
	type EditContext,
} from "./schemas";

// Re-export confidence scoring
export {
	calculateConfidence,
	CONFIDENCE_THRESHOLD,
	type ConfidenceInput,
} from "./confidence";

// Re-export errors
export { FIMError } from "./errors";

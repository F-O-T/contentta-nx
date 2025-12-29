import { z } from "zod";

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
 * FIM Streaming Chunk Schema
 */
export const FIMChunkSchema = z.object({
	text: z.string(),
	done: z.boolean().default(false),
});

export type FIMChunk = z.infer<typeof FIMChunkSchema>;

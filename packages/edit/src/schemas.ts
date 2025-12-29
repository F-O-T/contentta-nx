import { z } from "zod";

/**
 * Edit Request Schema
 * Used to validate input for AI-powered text editing requests
 */
export const EditRequestSchema = z.object({
	selectedText: z.string().min(1, "Selected text is required"),
	instruction: z.string().min(1, "Edit instruction is required"),
	contextBefore: z.string().default(""),
	contextAfter: z.string().default(""),
	maxTokens: z.number().min(1).max(1024).default(256),
	temperature: z.number().min(0).max(1).default(0.3),
});

export type EditRequest = z.infer<typeof EditRequestSchema>;

/**
 * Edit Response Schema (for non-streaming)
 */
export const EditResponseSchema = z.object({
	editedText: z.string(),
	finishReason: z.enum(["stop", "length", "content_filter"]).optional(),
});

export type EditResponse = z.infer<typeof EditResponseSchema>;

/**
 * Edit Streaming Chunk Schema
 */
export const EditChunkSchema = z.object({
	text: z.string(),
	done: z.boolean().default(false),
});

export type EditChunk = z.infer<typeof EditChunkSchema>;

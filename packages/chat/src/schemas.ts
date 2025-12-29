import { z } from "zod";

/**
 * Individual message in a chat conversation
 */
export const ChatMessageSchema = z.object({
	role: z.enum(["user", "assistant"]),
	content: z.string(),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

/**
 * Selection context - text selected in the editor
 */
export const SelectionContextSchema = z.object({
	text: z.string(),
	contextBefore: z.string().default(""),
	contextAfter: z.string().default(""),
});

export type SelectionContext = z.infer<typeof SelectionContextSchema>;

/**
 * Content metadata - information about the content being edited
 */
export const ContentMetadataSchema = z.object({
	title: z.string(),
	description: z.string(),
	slug: z.string(),
	keywords: z.array(z.string()).optional(),
	status: z.string(),
});

export type ContentMetadata = z.infer<typeof ContentMetadataSchema>;

/**
 * Chat mode - determines the AI's behavior and response format
 */
export const ChatModeSchema = z.enum(["chat", "plan", "agent"]);
export type ChatMode = z.infer<typeof ChatModeSchema>;

/**
 * Chat request for streaming endpoint
 */
export const ChatRequestSchema = z.object({
	sessionId: z.string().uuid(),
	contentId: z.string().uuid(),
	messages: z.array(ChatMessageSchema),
	selectionContext: SelectionContextSchema.optional(),
	documentContext: z.string().optional(),
	contentMetadata: ContentMetadataSchema.optional(),
	mode: ChatModeSchema.default("chat"),
	maxTokens: z.number().min(1).max(4096).default(1024),
	temperature: z.number().min(0).max(1).default(0.7),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Chat streaming chunk response
 */
export const ChatChunkSchema = z.object({
	text: z.string(),
	done: z.boolean().default(false),
});

export type ChatChunk = z.infer<typeof ChatChunkSchema>;

/**
 * Non-streaming chat response
 */
export const ChatResponseSchema = z.object({
	content: z.string(),
	sessionId: z.string().uuid(),
	finishReason: z.enum(["stop", "length", "content_filter"]).optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

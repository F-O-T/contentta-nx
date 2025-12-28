import { z } from "zod";

export const ContentStatusSchema = z.enum([
   "pending",
   "processing",
   "completed",
   "failed",
   "draft",
   "approved",
]);

export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ContentStatusEventSchema = z.object({
   contentId: z.string(),
   status: ContentStatusSchema,
   message: z.string(),
   progress: z.number().min(0).max(100).optional(),
   layout: z.string().optional(),
   data: z.record(z.string(), z.unknown()).optional(),
   timestamp: z.number().optional(),
});

export type ContentStatusEvent = z.infer<typeof ContentStatusEventSchema>;

export const CHANNELS = {
   contentStatus: (contentId: string) => `content:${contentId}:status`,
} as const;

export const EVENTS = {
   CONTENT_STATUS_CHANGED: "content:status:changed",
} as const;

import { z } from "zod";

export const QUEUE_NAMES = ["automation", "notification"] as const;

export const QueueNameSchema = z.enum(QUEUE_NAMES);

export type QueueName = z.infer<typeof QueueNameSchema>;

export const BaseJobDataSchema = z.object({
   organizationId: z.string(),
   timestamp: z.string(),
});

export type BaseJobData = z.infer<typeof BaseJobDataSchema>;

export const AutomationJobDataSchema = BaseJobDataSchema.extend({
   eventType: z.string(),
   metadata: z.record(z.string(), z.unknown()).optional(),
   payload: z.record(z.string(), z.unknown()),
});

export type AutomationJobData = z.infer<typeof AutomationJobDataSchema>;

export const NotificationJobDataSchema = BaseJobDataSchema.extend({
   body: z.string(),
   metadata: z.record(z.string(), z.unknown()).optional(),
   title: z.string(),
   type: z.string(),
   url: z.string().optional(),
   userId: z.string(),
});

export type NotificationJobData = z.infer<typeof NotificationJobDataSchema>;

export const JobDataSchema = z.union([
   AutomationJobDataSchema,
   NotificationJobDataSchema,
]);

export type JobData = z.infer<typeof JobDataSchema>;

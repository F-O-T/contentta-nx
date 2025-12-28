import { z } from "zod";

export const blockDependenciesSchema = z.object({
   npm: z.record(z.string(), z.string()),
   shadcn: z.array(z.string()),
});

export const blockFilesSchema = z.object({
   component: z.string(),
});

export const blockMetadataSchema = z.object({
   category: z.string(),
   dependencies: blockDependenciesSchema,
   files: blockFilesSchema,
   id: z.string(),
   name: z.string(),
});

export type BlockMetadata = z.infer<typeof blockMetadataSchema>;
export type BlockDependencies = z.infer<typeof blockDependenciesSchema>;
export type BlockFiles = z.infer<typeof blockFilesSchema>;

export const blockListItemSchema = z.object({
   category: z.string(),
   id: z.string(),
   name: z.string(),
});

export const blockListResponseSchema = z.array(blockListItemSchema);

export type BlockListItem = z.infer<typeof blockListItemSchema>;

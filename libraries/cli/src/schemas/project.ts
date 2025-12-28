import { z } from "zod";

export const packageManagerSchema = z.enum(["npm", "yarn", "pnpm", "bun"]);

export type PackageManager = z.infer<typeof packageManagerSchema>;

export const packageJsonSchema = z.object({
   dependencies: z.record(z.string(), z.string()).optional(),
   devDependencies: z.record(z.string(), z.string()).optional(),
   name: z.string().optional(),
   version: z.string().optional(),
});

export type PackageJson = z.infer<typeof packageJsonSchema>;

export interface ProjectInfo {
   packageManager: PackageManager;
   packageJsonPath: string;
   projectRoot: string;
}

import {
   type BlockDependencies,
   type BlockListItem,
   type BlockMetadata,
   blockDependenciesSchema,
   blockListResponseSchema,
   blockMetadataSchema,
} from "../schemas/registry.ts";

const REGISTRY_API_URL =
   process.env.CONTENTTA_REGISTRY_URL || "https://api.contentta.co";

export class RegistryError extends Error {
   public readonly blockId?: string;

   constructor(message: string, blockId?: string, cause?: unknown) {
      super(message, { cause });
      this.name = "RegistryError";
      this.blockId = blockId;
   }
}

export async function fetchBlockMetadata(
   blockId: string,
): Promise<BlockMetadata> {
   const response = await fetch(
      `${REGISTRY_API_URL}/api/registry/blocks/${blockId}`,
   );

   if (!response.ok) {
      if (response.status === 404) {
         throw new RegistryError(`Block "${blockId}" not found`, blockId);
      }
      throw new RegistryError(
         `Failed to fetch block "${blockId}": ${response.statusText}`,
         blockId,
      );
   }

   const data = await response.json();
   const parsed = blockMetadataSchema.safeParse(data);

   if (!parsed.success) {
      throw new RegistryError(
         `Invalid block metadata for "${blockId}": ${parsed.error.message}`,
         blockId,
         parsed.error,
      );
   }

   return parsed.data;
}

export async function fetchBlockDependencies(
   blockId: string,
): Promise<BlockDependencies> {
   const response = await fetch(
      `${REGISTRY_API_URL}/api/registry/blocks/${blockId}/dependencies`,
   );

   if (!response.ok) {
      if (response.status === 404) {
         throw new RegistryError(`Block "${blockId}" not found`, blockId);
      }
      throw new RegistryError(
         `Failed to fetch dependencies for "${blockId}": ${response.statusText}`,
         blockId,
      );
   }

   const data = await response.json();
   const parsed = blockDependenciesSchema.safeParse(data);

   if (!parsed.success) {
      throw new RegistryError(
         `Invalid dependencies for "${blockId}": ${parsed.error.message}`,
         blockId,
         parsed.error,
      );
   }

   return parsed.data;
}

export async function fetchAllBlocks(): Promise<BlockListItem[]> {
   const response = await fetch(`${REGISTRY_API_URL}/api/registry/blocks`);

   if (!response.ok) {
      throw new RegistryError(
         `Failed to fetch blocks list: ${response.statusText}`,
      );
   }

   const data = await response.json();
   const parsed = blockListResponseSchema.safeParse(data);

   if (!parsed.success) {
      throw new RegistryError(
         `Invalid blocks list response: ${parsed.error.message}`,
         undefined,
         parsed.error,
      );
   }

   return parsed.data;
}

export function transformImports(code: string): string {
   let transformed = code;

   // Transform @packages/ui imports to relative paths
   transformed = transformed.replace(
      /from ["']@packages\/ui\/components\/([^"']+)["']/g,
      'from "../ui/$1"',
   );

   transformed = transformed.replace(
      /from ["']@packages\/ui\/lib\/([^"']+)["']/g,
      'from "../../lib/$1"',
   );

   // Transform relative component imports
   transformed = transformed.replace(
      /from ["']\.\.\/components\//g,
      'from "../ui/',
   );

   transformed = transformed.replace(
      /from ["']\.\.\/lib\//g,
      'from "../../lib/',
   );

   transformed = transformed.replace(/from ["']\.\.\/blocks\//g, 'from "./');

   return transformed;
}

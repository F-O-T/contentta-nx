import { afterEach, describe, expect, it, mock } from "bun:test";
import {
   fetchAllBlocks,
   fetchBlockDependencies,
   fetchBlockMetadata,
   RegistryError,
   transformImports,
} from "../utils/registry.ts";

// Helper to create mock fetch
function createMockFetch(response: Partial<Response>) {
   const mockFn = mock(() => Promise.resolve(response as Response));
   return mockFn as unknown as typeof fetch;
}

describe("transformImports", () => {
   it("should transform @packages/ui/components imports", () => {
      const input = `import { Button } from "@packages/ui/components/button";`;
      const expected = `import { Button } from "../ui/button";`;

      expect(transformImports(input)).toBe(expected);
   });

   it("should transform @packages/ui/lib imports", () => {
      const input = `import { cn } from "@packages/ui/lib/utils";`;
      const expected = `import { cn } from "../../lib/utils";`;

      expect(transformImports(input)).toBe(expected);
   });

   it("should transform relative ../components imports", () => {
      const input = `import { Card } from "../components/card";`;
      const expected = `import { Card } from "../ui/card";`;

      expect(transformImports(input)).toBe(expected);
   });

   it("should transform relative ../lib imports", () => {
      const input = `import { cn } from "../lib/utils";`;
      const expected = `import { cn } from "../../lib/utils";`;

      expect(transformImports(input)).toBe(expected);
   });

   it("should transform relative ../blocks imports", () => {
      const input = `import { Logo } from "../blocks/logo";`;
      const expected = `import { Logo } from "./logo";`;

      expect(transformImports(input)).toBe(expected);
   });

   it("should handle multiple imports in same file", () => {
      const input = `import { Button } from "@packages/ui/components/button";
import { Card } from "@packages/ui/components/card";
import { cn } from "@packages/ui/lib/utils";
import { Logo } from "../blocks/logo";`;

      const result = transformImports(input);

      expect(result).toContain('from "../ui/button"');
      expect(result).toContain('from "../ui/card"');
      expect(result).toContain('from "../../lib/utils"');
      expect(result).toContain('from "./logo"');
   });

   it("should preserve non-matching imports", () => {
      const input = `import { useState } from "react";
import { motion } from "motion/react";`;

      expect(transformImports(input)).toBe(input);
   });

   it("should handle single quotes", () => {
      const input = `import { Button } from '@packages/ui/components/button';`;
      const expected = `import { Button } from "../ui/button";`;

      expect(transformImports(input)).toBe(expected);
   });
});

describe("RegistryError", () => {
   it("should create error with message", () => {
      const error = new RegistryError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.name).toBe("RegistryError");
      expect(error.blockId).toBeUndefined();
   });

   it("should create error with blockId", () => {
      const error = new RegistryError("Block not found", "hero-section-1");

      expect(error.message).toBe("Block not found");
      expect(error.blockId).toBe("hero-section-1");
   });

   it("should create error with cause", () => {
      const cause = new Error("Original error");
      const error = new RegistryError("Wrapped error", "block-id", cause);

      expect(error.message).toBe("Wrapped error");
      expect(error.cause).toBe(cause);
   });
});

describe("fetchBlockMetadata", () => {
   const originalFetch = globalThis.fetch;

   afterEach(() => {
      globalThis.fetch = originalFetch;
   });

   it("should fetch and parse valid block metadata", async () => {
      const mockResponse = {
         category: "hero",
         dependencies: {
            npm: { "lucide-react": "^0.548.0" },
            shadcn: ["button"],
         },
         files: {
            component: "export function HeroSection() {}",
         },
         id: "hero-section-1",
         name: "Hero Section 1",
      };

      globalThis.fetch = createMockFetch({
         json: () => Promise.resolve(mockResponse),
         ok: true,
      });

      const result = await fetchBlockMetadata("hero-section-1");

      expect(result.id).toBe("hero-section-1");
      expect(result.name).toBe("Hero Section 1");
      expect(result.category).toBe("hero");
      expect(result.dependencies.shadcn).toContain("button");
   });

   it("should throw RegistryError for 404 response", async () => {
      globalThis.fetch = createMockFetch({
         ok: false,
         status: 404,
         statusText: "Not Found",
      });

      await expect(fetchBlockMetadata("non-existent")).rejects.toThrow(
         RegistryError,
      );
      await expect(fetchBlockMetadata("non-existent")).rejects.toThrow(
         'Block "non-existent" not found',
      );
   });

   it("should throw RegistryError for other HTTP errors", async () => {
      globalThis.fetch = createMockFetch({
         ok: false,
         status: 500,
         statusText: "Internal Server Error",
      });

      await expect(fetchBlockMetadata("some-block")).rejects.toThrow(
         RegistryError,
      );
   });

   it("should throw RegistryError for invalid response data", async () => {
      const invalidResponse = {
         id: "hero-section-1",
         // missing required fields
      };

      globalThis.fetch = createMockFetch({
         json: () => Promise.resolve(invalidResponse),
         ok: true,
      });

      await expect(fetchBlockMetadata("hero-section-1")).rejects.toThrow(
         RegistryError,
      );
   });
});

describe("fetchBlockDependencies", () => {
   const originalFetch = globalThis.fetch;

   afterEach(() => {
      globalThis.fetch = originalFetch;
   });

   it("should fetch and parse valid dependencies", async () => {
      const mockResponse = {
         npm: { motion: "^12.23.24" },
         shadcn: ["card", "table"],
      };

      globalThis.fetch = createMockFetch({
         json: () => Promise.resolve(mockResponse),
         ok: true,
      });

      const result = await fetchBlockDependencies("features-one");

      expect(result.npm).toEqual({ motion: "^12.23.24" });
      expect(result.shadcn).toEqual(["card", "table"]);
   });

   it("should throw RegistryError for 404 response", async () => {
      globalThis.fetch = createMockFetch({
         ok: false,
         status: 404,
         statusText: "Not Found",
      });

      await expect(fetchBlockDependencies("non-existent")).rejects.toThrow(
         RegistryError,
      );
   });
});

describe("fetchAllBlocks", () => {
   const originalFetch = globalThis.fetch;

   afterEach(() => {
      globalThis.fetch = originalFetch;
   });

   it("should fetch and parse blocks list", async () => {
      const mockResponse = [
         { category: "hero", id: "hero-section-1", name: "Hero Section 1" },
         { category: "features", id: "features-one", name: "Features One" },
      ];

      globalThis.fetch = createMockFetch({
         json: () => Promise.resolve(mockResponse),
         ok: true,
      });

      const result = await fetchAllBlocks();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe("hero-section-1");
      expect(result[1]?.id).toBe("features-one");
   });

   it("should return empty array for empty response", async () => {
      globalThis.fetch = createMockFetch({
         json: () => Promise.resolve([]),
         ok: true,
      });

      const result = await fetchAllBlocks();

      expect(result).toHaveLength(0);
   });

   it("should throw RegistryError for HTTP errors", async () => {
      globalThis.fetch = createMockFetch({
         ok: false,
         status: 500,
         statusText: "Internal Server Error",
      });

      await expect(fetchAllBlocks()).rejects.toThrow(RegistryError);
   });
});

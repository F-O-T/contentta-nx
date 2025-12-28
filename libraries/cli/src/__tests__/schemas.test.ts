import { describe, expect, it } from "bun:test";
import {
   blockDependenciesSchema,
   blockFilesSchema,
   blockListItemSchema,
   blockListResponseSchema,
   blockMetadataSchema,
} from "../schemas/registry.ts";

describe("blockDependenciesSchema", () => {
   it("should validate valid dependencies", () => {
      const valid = {
         npm: { "lucide-react": "^0.548.0", motion: "^12.23.24" },
         shadcn: ["button", "card", "table"],
      };

      const result = blockDependenciesSchema.safeParse(valid);
      expect(result.success).toBe(true);
   });

   it("should validate empty dependencies", () => {
      const valid = {
         npm: {},
         shadcn: [],
      };

      const result = blockDependenciesSchema.safeParse(valid);
      expect(result.success).toBe(true);
   });

   it("should reject missing npm field", () => {
      const invalid = {
         shadcn: ["button"],
      };

      const result = blockDependenciesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });

   it("should reject missing shadcn field", () => {
      const invalid = {
         npm: {},
      };

      const result = blockDependenciesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });

   it("should reject invalid npm version format (non-string)", () => {
      const invalid = {
         npm: { "some-package": 123 },
         shadcn: [],
      };

      const result = blockDependenciesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });
});

describe("blockFilesSchema", () => {
   it("should validate valid files object", () => {
      const valid = {
         component: "export function MyComponent() { return <div />; }",
      };

      const result = blockFilesSchema.safeParse(valid);
      expect(result.success).toBe(true);
   });

   it("should validate empty component string", () => {
      const valid = {
         component: "",
      };

      const result = blockFilesSchema.safeParse(valid);
      expect(result.success).toBe(true);
   });

   it("should reject missing component field", () => {
      const invalid = {};

      const result = blockFilesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });
});

describe("blockMetadataSchema", () => {
   it("should validate complete block metadata", () => {
      const valid = {
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

      const result = blockMetadataSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
         expect(result.data.id).toBe("hero-section-1");
         expect(result.data.name).toBe("Hero Section 1");
         expect(result.data.category).toBe("hero");
      }
   });

   it("should reject metadata missing id", () => {
      const invalid = {
         category: "hero",
         dependencies: { npm: {}, shadcn: [] },
         files: { component: "" },
         name: "Hero Section",
      };

      const result = blockMetadataSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });

   it("should reject metadata missing dependencies", () => {
      const invalid = {
         category: "hero",
         files: { component: "" },
         id: "hero-section-1",
         name: "Hero Section",
      };

      const result = blockMetadataSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });
});

describe("blockListItemSchema", () => {
   it("should validate block list item", () => {
      const valid = {
         category: "features",
         id: "features-one",
         name: "Features One",
      };

      const result = blockListItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
   });

   it("should reject item missing category", () => {
      const invalid = {
         id: "features-one",
         name: "Features One",
      };

      const result = blockListItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });
});

describe("blockListResponseSchema", () => {
   it("should validate array of block items", () => {
      const valid = [
         { category: "hero", id: "hero-section-1", name: "Hero Section 1" },
         { category: "features", id: "features-one", name: "Features One" },
         { category: "footer", id: "footer-one", name: "Footer One" },
      ];

      const result = blockListResponseSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
         expect(result.data).toHaveLength(3);
      }
   });

   it("should validate empty array", () => {
      const valid: unknown[] = [];

      const result = blockListResponseSchema.safeParse(valid);
      expect(result.success).toBe(true);
   });

   it("should reject non-array", () => {
      const invalid = { blocks: [] };

      const result = blockListResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });

   it("should reject array with invalid items", () => {
      const invalid = [
         { category: "hero", id: "hero-section-1", name: "Hero Section 1" },
         { id: "invalid" }, // missing category and name
      ];

      const result = blockListResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
   });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface BlockMetadata {
  id: string;
  name: string;
  category: string;
  files: {
    component: string;
  };
  dependencies: {
    shadcn: string[];
    npm: Record<string, string>;
  };
}

const BLOCKS_PATH = join(process.cwd(), "../..", "packages/ui/src/blocks");

const blockDependencies: Record<string, BlockMetadata> = {
  "features-one": {
    category: "features",
    dependencies: {
      npm: {},
      shadcn: ["card", "table"],
    },
    files: {
      component: "",
    },
    id: "features-one",
    name: "Features One",
  },
  "footer-one": {
    category: "footer",
    dependencies: {
      npm: {},
      shadcn: [],
    },
    files: {
      component: "",
    },
    id: "footer-one",
    name: "Footer One",
  },
  "hero-parallax": {
    category: "hero",
    dependencies: {
      npm: {
        motion: "^12.23.24",
      },
      shadcn: [],
    },
    files: {
      component: "",
    },
    id: "hero-parallax",
    name: "Hero Parallax",
  },
  "hero-section-1": {
    category: "hero",
    dependencies: {
      npm: {
        "lucide-react": "^0.548.0",
      },
      shadcn: ["button"],
    },
    files: {
      component: "",
    },
    id: "hero-section-1",
    name: "Hero Section 1",
  },
  logo: {
    category: "component",
    dependencies: {
      npm: {},
      shadcn: [],
    },
    files: {
      component: "",
    },
    id: "logo",
    name: "Logo",
  },
  "pricing-table": {
    category: "pricing",
    dependencies: {
      npm: {
        "@number-flow/react": "^0.5.10",
        "@radix-ui/react-icons": "^1.3.2",
      },
      shadcn: ["button", "table"],
    },
    files: {
      component: "",
    },
    id: "pricing-table",
    name: "Pricing Table",
  },
};

export function getBlockMetadata(blockId: string): BlockMetadata | null {
  const metadata = blockDependencies[blockId];
  if (!metadata) return null;

  try {
    const componentPath = join(BLOCKS_PATH, `${blockId}.tsx`);
    const componentContent = readFileSync(componentPath, "utf-8");

    return {
      ...metadata,
      files: {
        component: componentContent,
      },
    };
  } catch (error) {
    console.error(`Error reading block ${blockId}:`, error);
    return null;
  }
}

export function getAllBlockMetadata(): Array<
  Omit<BlockMetadata, "files"> & { files: { component: string } }
> {
  return Object.keys(blockDependencies).map((id) => {
    const metadata = blockDependencies[id];
    if (!metadata) {
      throw new Error(`Block ${id} not found in registry`);
    }
    return {
      category: metadata.category,
      dependencies: metadata.dependencies,
      files: {
        component: "",
      },
      id: metadata.id,
      name: metadata.name,
    };
  });
}

export function getBlockDependencies(
  blockId: string
): BlockMetadata["dependencies"] | null {
  const metadata = blockDependencies[blockId];
  if (!metadata) return null;
  return metadata.dependencies;
}

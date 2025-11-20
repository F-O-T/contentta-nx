import { FeaturesOne } from "@packages/ui/blocks/features-one";
import { FooterSection } from "@packages/ui/blocks/footer-one";
import { HeroParallax } from "@packages/ui/blocks/hero-parallax";
import { HeroSection1 } from "@packages/ui/blocks/hero-section-one";
import { PricingTable } from "@packages/ui/blocks/pricing-table";
import type React from "react";

export type BlockCategory =
  | "hero"
  | "features"
  | "footer"
  | "cta"
  | "testimonial"
  | "pricing";

export interface BlockDefinition {
  id: string;
  name: string;
  category: BlockCategory;
  description: string;
  component: React.ComponentType;
}

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  "features-one": {
    category: "features",
    component: FeaturesOne,
    description: "Features section with table, cards, and testimonial",
    id: "features-one",
    name: "Features Section 1",
  },
  "footer-one": {
    category: "footer",
    component: FooterSection,
    description: "Simple footer with links and copyright",
    id: "footer-one",
    name: "Footer Section 1",
  },
  "hero-parallax": {
    category: "hero",
    component: HeroParallax,
    description: "Parallax scrolling hero with product cards",
    id: "hero-parallax",
    name: "Hero Parallax",
  },
  "hero-section-1": {
    category: "hero",
    component: HeroSection1,
    description: "Modern hero section with image and CTA buttons",
    id: "hero-section-1",
    name: "Hero Section 1",
  },
  "pricing-table": {
    category: "pricing",
    component: PricingTable,
    description: "Interactive pricing table with plan comparison",
    id: "pricing-table",
    name: "Pricing Table",
  },
};
export const ALL_BLOCKS: BlockDefinition[] = Object.values(BLOCK_REGISTRY);

export function getBlockDefinition(
  blockId: string
): BlockDefinition | undefined {
  return BLOCK_REGISTRY[blockId];
}

import { FeaturesOne } from "@packages/ui/blocks/features-one";
import { FooterSection } from "@packages/ui/blocks/footer-one";
import { HeroParallax } from "@packages/ui/blocks/hero-parallax";
import { HeroSection1 } from "@packages/ui/blocks/hero-section-one";
import { PricingTable } from "@packages/ui/blocks/pricing-table";
import { Button } from "@packages/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import { BlockBrowser } from "./_components/block-browser";
import { BlockSelectorSheet } from "./_components/block-selector-sheet";
import { ExportDialog } from "./_components/export-dialog";
import {
  type BlockCategory,
  getBlockDefinition,
} from "./_utils/block-registry";

export const Route = createFileRoute("/lp-builder/")({
  component: RouteComponent,
});

interface BlockInstance {
  id: string;
  blockDefId: string;
  name: string;
}

function RouteComponent() {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  const [selectedCategory, setSelectedCategory] =
    useState<BlockCategory | null>(null);

  const [blockBrowserOpen, setBlockBrowserOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [blocks, setBlocks] = useState<BlockInstance[]>([
    {
      blockDefId: "hero-parallax",
      id: "block-1",
      name: "Hero Parallax",
    },
    {
      blockDefId: "hero-section-1",
      id: "block-2",
      name: "Hero Section 1",
    },
    {
      blockDefId: "features-one",
      id: "block-3",
      name: "Features Section 1",
    },
    {
      blockDefId: "footer-one",
      id: "block-4",
      name: "Footer Section 1",
    },
  ]);

  // Set first block as selected on mount
  if (selectedBlock === null && blocks.length > 0 && blocks[0]?.id) {
    setSelectedBlock(blocks[0].id);
  }

  const handleAddBlock = (blockDefId: string) => {
    const blockDef = getBlockDefinition(blockDefId);
    if (!blockDef) return;

    const newBlock: BlockInstance = {
      blockDefId: blockDefId,
      id: `block-${Date.now()}`,
      name: blockDef.name,
    };

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlock === blockId) {
      setSelectedBlock(blocks[0]?.id || null);
    }
  };

  const handleReorderBlocks = (reorderedBlockOptions: BlockInstance[]) => {
    const reorderedBlocks = reorderedBlockOptions
      .map((option) => blocks.find((b) => b.id === option.id))
      .filter((b): b is BlockInstance => b !== undefined);

    setBlocks(reorderedBlocks);
  };

  return (
    <div>
      <BlockBrowser
        onOpenChange={setBlockBrowserOpen}
        onSelectBlock={handleAddBlock}
        open={blockBrowserOpen}
        selectedCategory={selectedCategory}
      />

      <ExportDialog
        blockIds={blocks.map((b) => b.blockDefId)}
        onOpenChange={setExportDialogOpen}
        open={exportDialogOpen}
      />
      {/* TODO> Move isso aqui para outro lugar  */}
      <div className="fixed top-4 right-20 z-50">
        <Button
          disabled={blocks.length === 0}
          onClick={() => setExportDialogOpen(true)}
          size="lg"
        >
          <Download className="size-4" />
          Export
        </Button>
      </div>

      <BlockSelectorSheet
        blocks={blocks.map((b) => ({
          blockDefId: b.blockDefId,
          id: b.id,
          name: b.name,
        }))}
        onAddBlock={(category) => {
          setSelectedCategory(category);
          setBlockBrowserOpen(true);
        }}
        onRemoveBlock={handleRemoveBlock}
        onReorderBlocks={handleReorderBlocks}
        onSelectBlock={setSelectedBlock}
        onThemeChange={setSelectedTheme}
        selectedBlock={selectedBlock}
        selectedTheme={selectedTheme}
      />

      <div>
        {blocks.map((block) => {
          if (block.blockDefId === "hero-parallax") {
            return <HeroParallax key={block.id} />;
          }
          if (block.blockDefId === "hero-section-1") {
            return <HeroSection1 key={block.id} />;
          }
          if (block.blockDefId === "features-one") {
            return <FeaturesOne key={block.id} />;
          }
          if (block.blockDefId === "footer-one") {
            return <FooterSection key={block.id} />;
          }
          if (block.blockDefId === "pricing-table") {
            return <PricingTable key={block.id} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

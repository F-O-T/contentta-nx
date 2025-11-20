import { Button } from "@packages/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@packages/ui/components/carousel";
import { Dialog, DialogContent } from "@packages/ui/components/dialog";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import {
  ALL_BLOCKS,
  type BlockCategory,
  type BlockDefinition,
} from "../_utils/block-registry";

interface BlockBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBlock: (blockId: string) => void;
  selectedCategory: BlockCategory | null;
}

export function BlockBrowser({
  open,
  onOpenChange,
  onSelectBlock,
  selectedCategory,
}: BlockBrowserProps) {
  const filteredBlocks = useMemo(() => {
    return ALL_BLOCKS.filter((block) => block.category === selectedCategory);
  }, [selectedCategory]);

  const handleAddBlock = (blockId: string) => {
    onSelectBlock(blockId);
    onOpenChange(false);
  };

  return (
    <Dialog modal onOpenChange={onOpenChange} open={open}>
      <DialogContent className="min-w-[70vw] max-h-[90dvh] overflow-auto  max-w-none flex flex-col">
        <BlockCarousel blocks={filteredBlocks} onAdd={handleAddBlock} />
      </DialogContent>
    </Dialog>
  );
}

interface BlockCarouselProps {
  blocks: BlockDefinition[];
  onAdd: (blockId: string) => void;
}

function BlockCarousel({ blocks, onAdd }: BlockCarouselProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No blocks available
      </div>
    );
  }

  return (
    <Carousel className="h-full">
      <CarouselContent className="h-full flex flex-com items-center relative">
        {blocks.map((block) => (
          <CarouselItem key={block.id}>
            <div className=" h-full w-full flex my-auto border rounded-lg flex flex-col">
              {<block.component></block.component>}

              <Button
                className="fixed top-4 right-4"
                onClick={() => onAdd(block.id)}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add This Block
              </Button>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

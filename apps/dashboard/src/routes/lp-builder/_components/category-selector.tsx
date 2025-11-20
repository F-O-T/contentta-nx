import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@packages/ui/components/command";
import {
  DollarSign,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";
import type { BlockCategory } from "../_utils/block-registry";

interface CategorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorySelected: (category: BlockCategory) => void;
}

const CATEGORY_INFO: Record<
  BlockCategory,
  { label: string; icon: React.ReactNode; description: string }
> = {
  cta: {
    description: "Conversion-focused CTA sections",
    icon: <Megaphone className="h-4 w-4" />,
    label: "Call to Actions",
  },
  features: {
    description: "Feature showcases and product highlights",
    icon: <Sparkles className="h-4 w-4" />,
    label: "Feature Sections",
  },
  footer: {
    description: "Footer sections with links and info",
    icon: <Star className="h-4 w-4" />,
    label: "Footers",
  },
  hero: {
    description: "Hero sections with CTAs and images",
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: "Hero Sections",
  },
  pricing: {
    description: "Pricing plans and comparison tables",
    icon: <DollarSign className="h-4 w-4" />,
    label: "Pricing Tables",
  },
  testimonial: {
    description: "Customer reviews and social proof",
    icon: <MessageSquare className="h-4 w-4" />,
    label: "Testimonials",
  },
};

export function CategorySelector({
  open,
  onOpenChange,
  onCategorySelected,
}: CategorySelectorProps) {
  const handleSelectCategory = (category: BlockCategory) => {
    onOpenChange(false);
    onCategorySelected(category);
  };

  return (
    <CommandDialog
      description="Choose a category to browse blocks"
      onOpenChange={onOpenChange}
      open={open}
      title="Select Block Category"
    >
      <CommandInput placeholder="Search categories..." />
      <CommandList>
        <CommandEmpty>No categories found.</CommandEmpty>
        <CommandGroup heading="Block Categories">
          {(
            Object.entries(CATEGORY_INFO) as [
              BlockCategory,
              (typeof CATEGORY_INFO)[BlockCategory],
            ][]
          ).map(([category, info]) => (
            <CommandItem
              className="cursor-pointer"
              key={category}
              onSelect={() => handleSelectCategory(category)}
            >
              {info.icon}
              <div className="flex flex-col">
                <span className="font-medium">{info.label}</span>
                <span className="text-xs text-muted-foreground">
                  {info.description}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

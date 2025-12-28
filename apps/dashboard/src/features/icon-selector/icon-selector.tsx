import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { cn } from "@packages/ui/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";
import type { IconName } from "./lib/available-icons";
import { ICON_CATEGORIES } from "./lib/available-icons";
import { IconDisplay } from "./ui/icon-display";

interface IconSelectorProps {
   value?: IconName;
   onValueChange: (value: IconName) => void;
   className?: string;
}

export function IconSelector({
   value,
   onValueChange,
   className,
}: IconSelectorProps) {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState("");

   const getFilteredCategories = () => {
      if (!search) {
         return ICON_CATEGORIES;
      }

      const searchLower = search.toLowerCase();
      const filtered: Record<string, readonly string[]> = {};

      Object.entries(ICON_CATEGORIES).forEach(([category, icons]) => {
         const matchingIcons = icons.filter((iconName) =>
            iconName.toLowerCase().includes(searchLower),
         );
         if (matchingIcons.length > 0) {
            filtered[category] = matchingIcons;
         }
      });

      return filtered;
   };

   const filteredCategories = getFilteredCategories();
   const hasResults = Object.keys(filteredCategories).length > 0;

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <PopoverTrigger asChild>
            <Button
               aria-expanded={open}
               className={cn("w-full justify-start gap-2", className)}
               role="combobox"
               variant="outline"
            >
               {value ? (
                  <>
                     <IconDisplay iconName={value} size={16} />
                     <span>{value}</span>
                  </>
               ) : (
                  <span className="text-muted-foreground">
                     {translate("common.form.icon.placeholder")}
                  </span>
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent align="start" className="p-0">
            <Command>
               <CommandInput
                  onValueChange={setSearch}
                  placeholder="Search icons..."
                  value={search}
               />
               <CommandList className="">
                  {!hasResults && <CommandEmpty>No icon found.</CommandEmpty>}
                  {Object.entries(filteredCategories).map(
                     ([category, icons]) => (
                        <CommandGroup heading={category} key={category}>
                           {icons.map((iconName) => (
                              <CommandItem
                                 className="flex items-center gap-3 cursor-pointer"
                                 key={iconName}
                                 onSelect={() => {
                                    onValueChange(iconName as IconName);
                                    setOpen(false);
                                 }}
                                 value={iconName}
                              >
                                 <IconDisplay
                                    iconName={iconName as IconName}
                                    size={20}
                                 />
                                 <span className="flex-1">{iconName}</span>
                                 {value === iconName && (
                                    <Check className="h-4 w-4 text-primary" />
                                 )}
                              </CommandItem>
                           ))}
                        </CommandGroup>
                     ),
                  )}
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}

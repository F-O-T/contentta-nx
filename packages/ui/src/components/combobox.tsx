"use client";

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
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckIcon, ChevronsUpDownIcon, Plus } from "lucide-react";
import * as React from "react";

export interface ComboboxOption {
   value: string;
   label: string;
}

interface ComboboxProps {
   options: ComboboxOption[];
   value?: string;
   onValueChange?: (value: string) => void;
   placeholder?: string;
   searchPlaceholder?: string;
   emptyMessage?: string;
   className?: string;
   disabled?: boolean;
   onBlur?: React.FocusEventHandler<HTMLButtonElement>;
   onCreate?: (name: string) => void;
   createLabel?: string;
}

export function Combobox({
   options,
   value,
   onValueChange,
   placeholder = "Select option...",
   searchPlaceholder = "Search...",
   emptyMessage = "No option found.",
   className,
   disabled = false,
   onBlur,
   onCreate,
   createLabel = "Criar",
}: ComboboxProps) {
   const [open, setOpen] = React.useState(false);
   const [search, setSearch] = React.useState("");
   const [parentNode, setParentNode] = React.useState<HTMLDivElement | null>(
      null,
   );

   const selectedOption = options.find((option) => option.value === value);

   const filteredOptions = React.useMemo(() => {
      const searchTerm = search.trim().toLowerCase();
      if (!searchTerm) return options;
      return options.filter((option) => {
         return option.label.toLowerCase().includes(searchTerm);
      });
   }, [options, search]);

   const virtualizer = useVirtualizer({
      count: filteredOptions.length,
      estimateSize: () => 35,
      getScrollElement: () => parentNode,
   });

   const virtualItems = virtualizer.getVirtualItems();

   const refCallback = React.useCallback((node: HTMLDivElement | null) => {
      if (node) {
         setParentNode(node);
      }
   }, []);

   const handleCreate = () => {
      const trimmedSearch = search.trim();
      if (trimmedSearch && onCreate) {
         onCreate(trimmedSearch);
         setSearch("");
         setOpen(false);
      }
   };

   const showCreateOption =
      onCreate && search.trim().length > 0 && filteredOptions.length === 0;

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <PopoverTrigger asChild>
            <Button
               aria-expanded={open}
               className={cn("flex truncate items-center gap-2", className)}
               disabled={disabled}
               onBlur={onBlur}
               role="combobox"
               variant="outline"
            >
               {selectedOption ? selectedOption.label : placeholder}
               <ChevronsUpDownIcon className="size-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className=" p-0">
            <Command>
               <CommandInput
                  onValueChange={setSearch}
                  placeholder={searchPlaceholder}
                  value={search}
               />
               <CommandList ref={refCallback}>
                  {showCreateOption ? (
                     <CommandGroup>
                        <CommandItem
                           onSelect={handleCreate}
                           value={`create-${search.trim()}`}
                        >
                           <Plus className="mr-2 h-4 w-4" />
                           {createLabel} "{search.trim()}"
                        </CommandItem>
                     </CommandGroup>
                  ) : (
                     <CommandEmpty>{emptyMessage}</CommandEmpty>
                  )}
                  <CommandGroup>
                     <div
                        style={{
                           height: virtualizer.getTotalSize(),
                           position: "relative",
                           width: "100%",
                        }}
                     >
                        {virtualItems.length > 0 ? (
                           <div
                              style={{
                                 left: 0,
                                 position: "absolute",
                                 top: 0,
                                 transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                                 width: "100%",
                              }}
                           >
                              {virtualItems.map((virtualRow) => {
                                 const option =
                                    filteredOptions[virtualRow.index];

                                 if (!option) return null;

                                 return (
                                    <CommandItem
                                       key={option.value}
                                       onSelect={(currentValue) => {
                                          onValueChange?.(
                                             currentValue === value
                                                ? ""
                                                : currentValue,
                                          );
                                          setOpen(false);
                                       }}
                                       ref={virtualizer.measureElement}
                                       value={option.value}
                                    >
                                       <CheckIcon
                                          className={cn(
                                             "mr-2 h-4 w-4",
                                             value === option.value
                                                ? "opacity-100"
                                                : "opacity-0",
                                          )}
                                       />
                                       {option.label}
                                    </CommandItem>
                                 );
                              })}
                           </div>
                        ) : null}
                     </div>
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}

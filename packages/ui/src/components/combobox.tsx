"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@packages/ui/lib/utils";
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

interface ComboboxOption {
   value: string;
   label: string;
   description?: string;
   disabled?: boolean;
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
   allowClear?: boolean;
   renderOption?: (
      option: ComboboxOption,
      isSelected: boolean,
   ) => React.ReactNode;
}

export function Combobox({
   options,
   value: controlledValue,
   onValueChange,
   placeholder = "Select an option...",
   searchPlaceholder = "Search...",
   emptyMessage = "No option found.",
   className,
   disabled = false,
   allowClear = true,
   renderOption,
}: ComboboxProps) {
   const [open, setOpen] = React.useState(false);
   const [internalValue, setInternalValue] = React.useState("");

   // Use controlled value if provided, otherwise use internal state
   const value = controlledValue ?? internalValue;
   const setValue = onValueChange ?? setInternalValue;

   const selectedOption = options.find((option) => option.value === value);

   const handleSelect = (currentValue: string) => {
      const newValue = allowClear && currentValue === value ? "" : currentValue;
      setValue(newValue);
      setOpen(false);
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               variant="outline"
               role="combobox"
               aria-expanded={open}
               disabled={disabled}
               className={cn("justify-between flex items-center", className)}
            >
               {selectedOption?.label || placeholder}
               <ChevronsUpDownIcon className=" h-4 w-4 shrink-0 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className={cn("p-0")}>
            <Command>
               <CommandInput placeholder={searchPlaceholder} />
               <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                     {options.map((option) => {
                        const isSelected = value === option.value;
                        return (
                           <CommandItem
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                              onSelect={handleSelect}
                           >
                              <CheckIcon
                                 className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0",
                                 )}
                              />
                              {renderOption ? (
                                 renderOption(option, isSelected)
                              ) : (
                                 <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    {option.description && (
                                       <span className="text-sm text-muted-foreground">
                                          {option.description}
                                       </span>
                                    )}
                                 </div>
                              )}
                           </CommandItem>
                        );
                     })}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}

// Example usage with the original frameworks data

"use client";

import { Badge } from "@packages/ui/components/badge";
import {
   Command,
   CommandGroup,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import { cn } from "@packages/ui/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { Plus, X } from "lucide-react";
import * as React from "react";

export type Option = {
   label: string;
   value: string;
   icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
};

interface MultiSelectProps {
   options: Option[];
   selected: string[];
   onChange: (selected: string[]) => void;
   className?: string;
   placeholder?: string;
   emptyMessage?: string;
   onCreate?: (name: string) => void;
   createLabel?: string;
}

export function MultiSelect({
   options,
   selected,
   onChange,
   className,
   placeholder = "Select options...",
   onCreate,
   createLabel = "Criar",
}: MultiSelectProps) {
   const inputRef = React.useRef<HTMLInputElement>(null);
   const [open, setOpen] = React.useState(false);
   const [inputValue, setInputValue] = React.useState("");

   const handleUnselect = React.useCallback(
      (item: string) => {
         onChange(selected.filter((i) => i !== item));
      },
      [onChange, selected],
   );

   const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
         const input = inputRef.current;
         if (input) {
            if (e.key === "Delete" || e.key === "Backspace") {
               if (input.value === "") {
                  const newSelected = [...selected];
                  newSelected.pop();
                  onChange(newSelected);
               }
            }
            if (e.key === "Escape") {
               input.blur();
            }
         }
      },
      [onChange, selected],
   );

   const selectables = React.useMemo(
      () => options.filter((option) => !selected.includes(option.value)),
      [options, selected],
   );

   const filteredSelectables = React.useMemo(() => {
      const searchTerm = inputValue.trim().toLowerCase();
      if (!searchTerm) return selectables;
      return selectables.filter((option) =>
         option.label.toLowerCase().includes(searchTerm),
      );
   }, [selectables, inputValue]);

   const handleCreate = () => {
      const trimmedValue = inputValue.trim();
      if (trimmedValue && onCreate) {
         onCreate(trimmedValue);
         setInputValue("");
      }
   };

   const showCreateOption =
      onCreate &&
      inputValue.trim().length > 0 &&
      filteredSelectables.length === 0;

   return (
      <Command
         className={cn("overflow-visible bg-transparent", className)}
         onKeyDown={handleKeyDown}
      >
         <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <div className="flex flex-wrap gap-1">
               {selected.map((item) => {
                  const opt = options.find((o) => o.value === item);
                  const IconComponent = opt?.icon;
                  return (
                     <Badge key={item} variant="secondary">
                        {IconComponent &&
                        typeof IconComponent === "function" ? (
                           <IconComponent className="mr-1 h-3 w-3" />
                        ) : IconComponent ? (
                           <span className="mr-1">{IconComponent}</span>
                        ) : null}
                        {opt?.label || item}
                        <button
                           className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                           onClick={() => handleUnselect(item)}
                           onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                 handleUnselect(item);
                              }
                           }}
                           onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                           }}
                           type="button"
                        >
                           <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                     </Badge>
                  );
               })}
               <CommandPrimitive.Input
                  className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                  onBlur={() => setOpen(false)}
                  onFocus={() => setOpen(true)}
                  onValueChange={setInputValue}
                  placeholder={selected.length === 0 ? placeholder : undefined}
                  ref={inputRef}
                  value={inputValue}
               />
            </div>
         </div>
         <div className="relative mt-2">
            <CommandList>
               {open && (filteredSelectables.length > 0 || showCreateOption) ? (
                  <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                     <CommandGroup className="h-full overflow-auto max-h-64">
                        {showCreateOption && (
                           <CommandItem
                              className="cursor-pointer"
                              onMouseDown={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                              }}
                              onSelect={handleCreate}
                              value={`create-${inputValue.trim()}`}
                           >
                              <Plus className="mr-2 h-4 w-4" />
                              {createLabel} "{inputValue.trim()}"
                           </CommandItem>
                        )}
                        {filteredSelectables.map((opt) => {
                           const IconComponent = opt?.icon;
                           return (
                              <CommandItem
                                 className="cursor-pointer"
                                 key={opt.value}
                                 onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                 }}
                                 onSelect={() => {
                                    setInputValue("");
                                    onChange([...selected, opt.value]);
                                 }}
                              >
                                 {IconComponent &&
                                 typeof IconComponent === "function" ? (
                                    <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />
                                 ) : IconComponent ? (
                                    <span className="mr-2 text-muted-foreground">
                                       {IconComponent}
                                    </span>
                                 ) : null}
                                 {opt.label}
                              </CommandItem>
                           );
                        })}
                     </CommandGroup>
                  </div>
               ) : null}
            </CommandList>
         </div>
      </Command>
   );
}

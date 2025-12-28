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
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

const currencies = [
   { label: "Real Brasileiro (BRL)", value: "BRL" },
   { label: "US Dollar (USD)", value: "USD" },
   { label: "Euro (EUR)", value: "EUR" },
   { label: "British Pound (GBP)", value: "GBP" },
];

export function CurrencyCommand() {
   const [open, setOpen] = useState(false);
   const [value, setValue] = useState("BRL");

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <PopoverTrigger asChild>
            <Button
               aria-expanded={open}
               className="w-[200px] justify-between"
               role="combobox"
               variant="outline"
            >
               {value
                  ? currencies.find((currency) => currency.value === value)
                       ?.label
                  : "Select currency..."}
               <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-[200px] p-0">
            <Command>
               <CommandInput placeholder="Search currency..." />
               <CommandList>
                  <CommandEmpty>No currency found.</CommandEmpty>
                  <CommandGroup>
                     {currencies.map((currency) => (
                        <CommandItem
                           key={currency.value}
                           onSelect={(currentValue) => {
                              setValue(
                                 currentValue === value ? "" : currentValue,
                              );
                              setOpen(false);
                           }}
                           value={currency.value}
                        >
                           <Check
                              className={cn(
                                 "mr-2 h-4 w-4",
                                 value === currency.value
                                    ? "opacity-100"
                                    : "opacity-0",
                              )}
                           />
                           {currency.label}
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}

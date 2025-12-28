"use client";

import { Button } from "@packages/ui/components/button";
import { Calendar } from "@packages/ui/components/calendar";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { cn } from "@packages/ui/lib/utils";
import { formatDate } from "@packages/utils/date";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export interface DateRangePickerPopoverProps {
   startDate?: Date | null;
   endDate?: Date | null;
   onRangeChange: (range: {
      startDate: Date | null;
      endDate: Date | null;
   }) => void;
   placeholder?: string;
   className?: string;
   disabled?: boolean;
   align?: "start" | "center" | "end";
}

export function DateRangePickerPopover({
   startDate,
   endDate,
   onRangeChange,
   placeholder = "Personalizado",
   className,
   disabled = false,
   align = "start",
}: DateRangePickerPopoverProps) {
   const [open, setOpen] = useState(false);
   const [tempRange, setTempRange] = useState<DateRange | undefined>(() => {
      if (startDate && endDate) {
         return { from: startDate, to: endDate };
      }
      return undefined;
   });

   const hasSelection = startDate && endDate;

   const handleSelect = (range: DateRange | undefined) => {
      setTempRange(range);
   };

   const handleApply = () => {
      if (tempRange?.from && tempRange?.to) {
         onRangeChange({
            startDate: tempRange.from,
            endDate: tempRange.to,
         });
      }
      setOpen(false);
   };

   const handleClear = () => {
      setTempRange(undefined);
      onRangeChange({ startDate: null, endDate: null });
      setOpen(false);
   };

   const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
         setTempRange(
            startDate && endDate ? { from: startDate, to: endDate } : undefined,
         );
      }
   };

   const formatRangeLabel = () => {
      if (!hasSelection) {
         return placeholder;
      }
      return `${formatDate(startDate, "DD/MM")} - ${formatDate(endDate, "DD/MM")}`;
   };

   return (
      <Popover onOpenChange={handleOpenChange} open={open}>
         <PopoverTrigger asChild>
            <Button
               className={cn(
                  "gap-1.5 shrink-0",
                  hasSelection &&
                     "bg-transparent text-primary border-primary *:[svg]:stroke-primary",
                  className,
               )}
               disabled={disabled}
               size="sm"
               variant="outline"
            >
               <CalendarIcon className="size-3" />
               <span>{formatRangeLabel()}</span>
            </Button>
         </PopoverTrigger>
         <PopoverContent align={align} className="w-auto p-0">
            <div className="p-3">
               <Calendar
                  defaultMonth={startDate || new Date()}
                  mode="range"
                  numberOfMonths={1}
                  onSelect={handleSelect}
                  selected={tempRange}
               />
            </div>
            <div className="flex items-center justify-end gap-2 border-t p-3">
               <Button onClick={handleClear} size="sm" variant="ghost">
                  Limpar
               </Button>
               <Button
                  disabled={!tempRange?.from || !tempRange?.to}
                  onClick={handleApply}
                  size="sm"
               >
                  Aplicar
               </Button>
            </div>
         </PopoverContent>
      </Popover>
   );
}

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
import { Calendar as CalendarIcon } from "lucide-react";

export interface DatePickerProps {
   date?: Date;
   onSelect?: (date: Date | undefined) => void;
   placeholder?: string;
   className?: string;
}

export function DatePicker({
   date,
   onSelect,
   placeholder = "Pick a date",
   className,
}: DatePickerProps) {
   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button
               className={cn(
                  "data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal",
                  className,
               )}
               data-empty={!date}
               variant="outline"
            >
               <CalendarIcon />
               {date ? (
                  formatDate(date, "DD MMMM YYYY")
               ) : (
                  <span>{placeholder}</span>
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-auto p-0">
            <Calendar mode="single" onSelect={onSelect} selected={date} />
         </PopoverContent>
      </Popover>
   );
}

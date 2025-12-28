"use client";

import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { cn } from "@packages/ui/lib/utils";
import { formatDate } from "@packages/utils/date";
import {
   addMonths,
   getMonth,
   getYear,
   setMonth,
   setYear,
   subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export interface MonthSelectorProps {
   date: Date;
   onSelect: (date: Date) => void;
   className?: string;
   minDate?: Date;
   maxDate?: Date;
   disabled?: boolean;
}

const MONTHS = [
   "Janeiro",
   "Fevereiro",
   "Março",
   "Abril",
   "Maio",
   "Junho",
   "Julho",
   "Agosto",
   "Setembro",
   "Outubro",
   "Novembro",
   "Dezembro",
];

export function MonthSelector({
   date,
   onSelect,
   className,
   minDate,
   maxDate,
   disabled = false,
}: MonthSelectorProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [viewYear, setViewYear] = useState(getYear(date));

   const currentMonth = getMonth(date);
   const currentYear = getYear(date);
   const today = new Date();

   useEffect(() => {
      setViewYear(getYear(date));
   }, [date]);

   const handlePreviousMonth = () => {
      const newDate = subMonths(date, 1);
      if (minDate && newDate < minDate) return;
      onSelect(newDate);
   };

   const handleNextMonth = () => {
      const newDate = addMonths(date, 1);
      if (maxDate && newDate > maxDate) return;
      onSelect(newDate);
   };

   const handleMonthSelect = (monthIndex: number) => {
      let newDate = setMonth(date, monthIndex);
      newDate = setYear(newDate, viewYear);
      onSelect(newDate);
      setIsOpen(false);
   };

   const handlePreviousYear = () => {
      setViewYear((prev) => prev - 1);
   };

   const handleNextYear = () => {
      setViewYear((prev) => prev + 1);
   };

   const isMonthDisabled = (monthIndex: number) => {
      const testDate = setMonth(setYear(date, viewYear), monthIndex);
      if (minDate && testDate < minDate) return true;
      if (maxDate && testDate > maxDate) return true;
      return false;
   };

   const isSelectedMonth = (monthIndex: number) => {
      return monthIndex === currentMonth && viewYear === currentYear;
   };

   const isToday = (monthIndex: number) => {
      return monthIndex === getMonth(today) && viewYear === getYear(today);
   };

   return (
      <div className={cn("flex items-center gap-1", className)}>
         <Button
            disabled={disabled}
            onClick={handlePreviousMonth}
            size="icon"
            variant="ghost"
         >
            <ChevronLeft className="size-4" />
         </Button>

         <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
               <Button
                  className="min-w-[160px] justify-center gap-2 font-medium"
                  disabled={disabled}
                  variant="outline"
               >
                  <CalendarDays className="size-4" />
                  <span className="capitalize">
                     {formatDate(date, "MMMM YYYY")}
                  </span>
               </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[280px] p-0">
               <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                     <Button
                        className="size-8"
                        onClick={handlePreviousYear}
                        size="icon"
                        variant="ghost"
                     >
                        <ChevronLeft className="size-4" />
                     </Button>
                     <span className="text-sm font-semibold">{viewYear}</span>
                     <Button
                        className="size-8"
                        onClick={handleNextYear}
                        size="icon"
                        variant="ghost"
                     >
                        <ChevronRight className="size-4" />
                     </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                     {MONTHS.map((month, index) => {
                        const selected = isSelectedMonth(index);
                        const todayMonth = isToday(index);
                        return (
                           <Button
                              className={cn(
                                 "h-9 text-xs font-medium transition-colors",
                                 selected &&
                                    "bg-primary text-primary-foreground hover:bg-primary/90",
                                 !selected &&
                                    todayMonth &&
                                    "border-primary text-primary",
                              )}
                              disabled={isMonthDisabled(index)}
                              key={month}
                              onClick={() => handleMonthSelect(index)}
                              variant={
                                 selected
                                    ? "default"
                                    : todayMonth
                                      ? "outline"
                                      : "ghost"
                              }
                           >
                              {month.substring(0, 3)}
                           </Button>
                        );
                     })}
                  </div>
               </div>
            </PopoverContent>
         </Popover>

         <Button
            disabled={disabled}
            onClick={handleNextMonth}
            size="icon"
            variant="ghost"
         >
            <ChevronRight className="size-4" />
         </Button>
      </div>
   );
}

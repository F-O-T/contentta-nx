"use client";

import { cn } from "@packages/ui/lib/utils";
import {
   endOfDay,
   endOfMonth,
   endOfWeek,
   endOfYear,
   startOfDay,
   startOfMonth,
   startOfWeek,
   startOfYear,
   subDays,
   subMonths,
} from "date-fns";
import {
   Calendar,
   CalendarDays,
   CalendarRange,
   Clock,
   History,
   Infinity as InfinityIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

export type TimePeriod =
   | "all-time"
   | "today"
   | "yesterday"
   | "this-week"
   | "this-month"
   | "last-month"
   | "this-year"
   | "custom";

export interface TimePeriodDateRange {
   startDate: Date | null;
   endDate: Date | null;
   selectedMonth: Date;
}

export interface TimePeriodChipsProps {
   value: TimePeriod | null;
   onValueChange: (
      value: TimePeriod | null,
      dateRange: TimePeriodDateRange,
   ) => void;
   className?: string;
   disabled?: boolean;
   size?: "sm" | "default" | "lg";
   scrollable?: boolean;
}

const PERIODS: {
   value: TimePeriod;
   label: string;
   shortLabel: string;
   icon: React.ComponentType<{ className?: string }>;
}[] = [
   { icon: Clock, label: "Hoje", shortLabel: "Hoje", value: "today" },
   { icon: History, label: "Ontem", shortLabel: "Ontem", value: "yesterday" },
   {
      icon: CalendarRange,
      label: "Esta Semana",
      shortLabel: "Semana",
      value: "this-week",
   },
   {
      icon: CalendarDays,
      label: "Este Mês",
      shortLabel: "Mês",
      value: "this-month",
   },
   {
      icon: History,
      label: "Mês Passado",
      shortLabel: "Anterior",
      value: "last-month",
   },
   {
      icon: Calendar,
      label: "Este Ano",
      shortLabel: "Ano",
      value: "this-year",
   },
   {
      icon: InfinityIcon,
      label: "Todo Período",
      shortLabel: "Todos",
      value: "all-time",
   },
];

export function getDateRangeForPeriod(period: TimePeriod): TimePeriodDateRange {
   const today = new Date();

   switch (period) {
      case "all-time":
         return {
            endDate: null,
            selectedMonth: today,
            startDate: null,
         };
      case "today":
         return {
            endDate: endOfDay(today),
            selectedMonth: today,
            startDate: startOfDay(today),
         };
      case "yesterday": {
         const yesterday = subDays(today, 1);
         return {
            endDate: endOfDay(yesterday),
            selectedMonth: yesterday,
            startDate: startOfDay(yesterday),
         };
      }
      case "this-week":
         return {
            endDate: endOfWeek(today, { weekStartsOn: 1 }),
            selectedMonth: today,
            startDate: startOfWeek(today, { weekStartsOn: 1 }),
         };
      case "this-month":
         return {
            endDate: endOfMonth(today),
            selectedMonth: today,
            startDate: startOfMonth(today),
         };
      case "last-month": {
         const lastMonth = subMonths(today, 1);
         return {
            endDate: endOfMonth(lastMonth),
            selectedMonth: lastMonth,
            startDate: startOfMonth(lastMonth),
         };
      }
      case "this-year":
         return {
            endDate: endOfYear(today),
            selectedMonth: today,
            startDate: startOfYear(today),
         };
      case "custom":
         return {
            endDate: null,
            selectedMonth: today,
            startDate: null,
         };
      default:
         return {
            endDate: null,
            selectedMonth: today,
            startDate: null,
         };
   }
}

export function TimePeriodChips({
   value,
   onValueChange,
   className,
   disabled = false,
   size = "default",
   scrollable = false,
}: TimePeriodChipsProps) {
   const handleValueChange = (newValue: string) => {
      if (!newValue) {
         onValueChange(null, {
            endDate: null,
            selectedMonth: new Date(),
            startDate: null,
         });
         return;
      }

      const period = newValue as TimePeriod;
      const dateRange = getDateRangeForPeriod(period);
      onValueChange(period, dateRange);
   };

   return (
      <ToggleGroup
         className={cn(
            "justify-start",
            scrollable
               ? "flex-nowrap overflow-x-auto scrollbar-none"
               : "flex-wrap",
            className,
         )}
         disabled={disabled}
         onValueChange={handleValueChange}
         size={size}
         spacing={2}
         type="single"
         value={value || ""}
         variant="outline"
      >
         {PERIODS.map((period) => {
            const Icon = period.icon;
            return (
               <ToggleGroupItem
                  aria-label={`Toggle ${period.value}`}
                  className={cn(
                     "gap-1.5 shrink-0 data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:*:[svg]:stroke-primary",
                     size === "sm" && "text-xs px-2 h-7",
                  )}
                  key={period.value}
                  value={period.value}
               >
                  <Icon className={cn("size-3.5", size === "sm" && "size-3")} />
                  <span className="hidden sm:inline">{period.label}</span>
                  <span className="sm:hidden">{period.shortLabel}</span>
               </ToggleGroupItem>
            );
         })}
      </ToggleGroup>
   );
}

export { PERIODS as TIME_PERIODS };

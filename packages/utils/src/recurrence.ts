export type RecurrencePattern =
   | "daily"
   | "weekly"
   | "biweekly"
   | "monthly"
   | "quarterly"
   | "semiannual"
   | "annual";

export interface RecurrenceConfig {
   pattern: RecurrencePattern;
   baseDate: Date;
}

export function getNextDueDate(
   currentDueDate: Date,
   pattern: RecurrencePattern,
): Date {
   const nextDate = new Date(currentDueDate);

   switch (pattern) {
      case "daily":
         nextDate.setDate(nextDate.getDate() + 1);
         break;
      case "weekly":
         nextDate.setDate(nextDate.getDate() + 7);
         break;
      case "biweekly":
         nextDate.setDate(nextDate.getDate() + 14);
         break;
      case "monthly":
         nextDate.setMonth(nextDate.getMonth() + 1);
         break;
      case "quarterly":
         nextDate.setMonth(nextDate.getMonth() + 3);
         break;
      case "semiannual":
         nextDate.setMonth(nextDate.getMonth() + 6);
         break;
      case "annual":
         nextDate.setFullYear(nextDate.getFullYear() + 1);
         break;
   }

   return nextDate;
}

export function getRecurrenceLabel(pattern: RecurrencePattern): string {
   const labels: Record<RecurrencePattern, string> = {
      annual: "Anual",
      biweekly: "Quinzenal",
      daily: "Diario",
      monthly: "Mensal",
      quarterly: "Trimestral",
      semiannual: "Semestral",
      weekly: "Semanal",
   };

   return labels[pattern];
}

export function getRecurrencePatterns(): RecurrencePattern[] {
   return ["monthly", "quarterly", "semiannual", "annual"];
}

export function getDefaultFutureOccurrences(
   pattern: RecurrencePattern,
): number {
   const defaults: Record<RecurrencePattern, number> = {
      annual: 5,
      biweekly: 24,
      daily: 30,
      monthly: 12,
      quarterly: 8,
      semiannual: 6,
      weekly: 52,
   };

   return defaults[pattern];
}

export function generateFutureDates(
   baseDate: Date,
   pattern: RecurrencePattern,
   count?: number,
): Date[] {
   const occurrences = count ?? getDefaultFutureOccurrences(pattern);
   const dates: Date[] = [];
   let currentDate = new Date(baseDate);

   for (let i = 0; i < occurrences; i++) {
      currentDate = getNextDueDate(currentDate, pattern);
      dates.push(new Date(currentDate));
   }

   return dates;
}

export function generateFutureDatesUntil(
   baseDate: Date,
   pattern: RecurrencePattern,
   untilDate: Date,
): Date[] {
   const dates: Date[] = [];
   let currentDate = new Date(baseDate);

   while (currentDate < untilDate) {
      currentDate = getNextDueDate(currentDate, pattern);
      if (currentDate <= untilDate) {
         dates.push(new Date(currentDate));
      }
   }

   return dates;
}

export function getCurrentDate(timezone?: string): { date: string } {
   const now = new Date();

   if (timezone) {
      return {
         date: now
            .toLocaleDateString("en-CA", {
               day: "2-digit",
               month: "2-digit",
               timeZone: timezone,
               year: "numeric",
            })
            .replace(/\//g, "-"),
      };
   }

   const year = now.getFullYear();
   const month = String(now.getMonth() + 1).padStart(2, "0");
   const day = String(now.getDate()).padStart(2, "0");

   return { date: `${year}-${month}-${day}` };
}

export type DateLocale = "pt-BR" | "en-US";

interface DateParts {
   day: string;
   hours: string;
   minutes: string;
   month: string;
   monthLong: string;
   monthShort: string;
   seconds: string;
   year: string;
}

function getDateParts(
   date: Date,
   locale: DateLocale,
   timezone?: string,
   useUTC = true,
): DateParts {
   if (useUTC) {
      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const year = String(date.getUTCFullYear());
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      const seconds = String(date.getUTCSeconds()).padStart(2, "0");

      const monthLongFormatter = new Intl.DateTimeFormat(locale, {
         month: "long",
         timeZone: "UTC",
      });
      const monthShortFormatter = new Intl.DateTimeFormat(locale, {
         month: "short",
         timeZone: "UTC",
      });

      return {
         day,
         hours,
         minutes,
         month,
         monthLong: monthLongFormatter.format(date),
         monthShort: monthShortFormatter.format(date),
         seconds,
         year,
      };
   }

   const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone: timezone,
      year: "numeric",
   };

   const formatter = new Intl.DateTimeFormat(locale, options);
   const parts = formatter.formatToParts(date);

   const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((p) => p.type === type)?.value ?? "";

   const monthLongFormatter = new Intl.DateTimeFormat(locale, {
      month: "long",
      timeZone: timezone,
   });
   const monthShortFormatter = new Intl.DateTimeFormat(locale, {
      month: "short",
      timeZone: timezone,
   });

   return {
      day: getPart("day"),
      hours: getPart("hour"),
      minutes: getPart("minute"),
      month: getPart("month"),
      monthLong: monthLongFormatter.format(date),
      monthShort: monthShortFormatter.format(date),
      seconds: getPart("second"),
      year: getPart("year"),
   };
}

export function formatDate(
   date: Date,
   format: string = "MM/DD/YYYY",
   options?: { locale?: DateLocale; timezone?: string; useUTC?: boolean },
): string {
   if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error("Invalid date provided");
   }

   const locale = options?.locale ?? "pt-BR";
   const timezone = options?.timezone;
   const useUTC = options?.useUTC ?? true;

   const parts = getDateParts(date, locale, timezone, useUTC);

   return format
      .replace(/YYYY/g, parts.year)
      .replace(/yyyy/g, parts.year)
      .replace(/MMMM/g, parts.monthLong)
      .replace(/MMM/g, parts.monthShort)
      .replace(/MM/g, parts.month)
      .replace(/DD/g, parts.day)
      .replace(/dd/g, parts.day)
      .replace(/HH/g, parts.hours)
      .replace(/mm/g, parts.minutes)
      .replace(/ss/g, parts.seconds);
}

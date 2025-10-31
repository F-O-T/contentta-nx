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

export function formatDate(
   date: Date,
   format: string = "MM/DD/YYYY",
   timezone?: string,
): string {
   // Validate date
   if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error("Invalid date provided");
   }

   let year: string;
   let month: string;
   let day: string;

   if (timezone) {
      const options: Intl.DateTimeFormatOptions = {
         day: "2-digit",
         month: "2-digit",
         timeZone: timezone,
         year: "numeric",
      };
      const parts = date.toLocaleDateString("en-US", options).split("/");

      // Type-safe extraction with validation
      if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
         throw new Error("Failed to parse date with timezone");
      }

      month = parts[0];
      day = parts[1];
      year = parts[2];
   } else {
      year = String(date.getFullYear());
      month = String(date.getMonth() + 1).padStart(2, "0");
      day = String(date.getDate()).padStart(2, "0");
   }

   // Replace all occurrences using regex
   return format
      .replace(/YYYY/g, year)
      .replace(/MM/g, month)
      .replace(/DD/g, day);
}

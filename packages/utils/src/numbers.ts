export function formatNumberIntoCurrency(
   amount: number,
   currency: string,
   locale: Intl.LocalesArgument,
): string {
   if (typeof amount !== "number" || Number.isNaN(amount)) return "";

   return new Intl.NumberFormat(locale, {
      currency: currency.toUpperCase(),
      style: "currency",
   }).format(amount / 100);
}
export function formatWindow(ms: number): string {
   if (typeof ms !== "number" || Number.isNaN(ms) || ms <= 0) return "period";

   const timeUnits = [
      { label: "day", unitMs: 86400000 },
      { label: "hour", unitMs: 3600000 },
      { label: "minute", unitMs: 60000 },
      { label: "second", unitMs: 1000 },
   ];

   for (const { unitMs, label } of timeUnits) {
      if (ms % unitMs === 0) {
         const value = ms / unitMs;
         return `${value} ${label}${value === 1 ? "" : "s"}`;
      }
   }

   return `${ms} ms`;
}

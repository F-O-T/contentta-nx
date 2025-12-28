import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function formatValueToTitleCase(val: string) {
   return val
      ?.replace(/_/g, " ")
      ?.replace(
         /\w\S*/g,
         (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
      );
}

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

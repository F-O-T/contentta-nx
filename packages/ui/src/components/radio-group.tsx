"use client";

import { cn } from "@packages/ui/lib/utils";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";
import type * as React from "react";

function RadioGroup({
   className,
   ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
   return (
      <RadioGroupPrimitive.Root
         className={cn("grid gap-3", className)}
         data-slot="radio-group"
         {...props}
      />
   );
}

function RadioGroupItem({
   className,
   ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
   return (
      <RadioGroupPrimitive.Item
         className={cn(
            "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className,
         )}
         data-slot="radio-group-item"
         {...props}
      >
         <RadioGroupPrimitive.Indicator
            className="relative flex items-center justify-center"
            data-slot="radio-group-indicator"
         >
            <CircleIcon className="fill-primary size-2" />
         </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
   );
}

export { RadioGroup, RadioGroupItem };

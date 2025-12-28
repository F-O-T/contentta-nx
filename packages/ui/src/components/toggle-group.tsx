"use client";

import { toggleVariants } from "@packages/ui/components/toggle";
import { cn } from "@packages/ui/lib/utils";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

const ToggleGroupContext = React.createContext<
   VariantProps<typeof toggleVariants> & { spacing?: number }
>({
   size: "default",
   spacing: 0,
   variant: "default",
});

function ToggleGroup({
   className,
   variant,
   size,
   spacing = 0,
   children,
   ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
   VariantProps<typeof toggleVariants> & {
      spacing?: number;
   }) {
   const hasSpacing = spacing > 0;

   return (
      <ToggleGroupPrimitive.Root
         className={cn(
            "group/toggle-group flex w-fit items-center",
            !hasSpacing && "rounded-md data-[variant=outline]:shadow-xs",
            hasSpacing && `gap-${spacing}`,
            className,
         )}
         data-size={size}
         data-slot="toggle-group"
         data-variant={variant}
         {...props}
      >
         <ToggleGroupContext.Provider value={{ size, spacing, variant }}>
            {children}
         </ToggleGroupContext.Provider>
      </ToggleGroupPrimitive.Root>
   );
}

function ToggleGroupItem({
   className,
   children,
   variant,
   size,
   ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
   VariantProps<typeof toggleVariants>) {
   const context = React.useContext(ToggleGroupContext);
   const hasSpacing = (context.spacing ?? 0) > 0;

   return (
      <ToggleGroupPrimitive.Item
         className={cn(
            toggleVariants({
               size: context.size || size,
               variant: context.variant || variant,
            }),
            hasSpacing
               ? "rounded-md shadow-none"
               : "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
            className,
         )}
         data-size={context.size || size}
         data-slot="toggle-group-item"
         data-variant={context.variant || variant}
         {...props}
      >
         {children}
      </ToggleGroupPrimitive.Item>
   );
}

export { ToggleGroup, ToggleGroupItem };

import { cn } from "@packages/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const appendixVariants = cva(
   "node-appendix absolute flex w-full flex-col items-center rounded-md border bg-card p-1 text-card-foreground",
   {
      defaultVariants: {
         position: "top",
      },
      variants: {
         position: {
            bottom: "top-full my-1",
            left: "-left-full -mx-1",
            right: "left-full mx-1",
            top: "-translate-y-full -my-1",
         },
      },
   },
);

export interface NodeAppendixProps
   extends ComponentProps<"div">,
      VariantProps<typeof appendixVariants> {
   className?: string;
   position?: "top" | "bottom" | "left" | "right";
}

export function NodeAppendix({
   children,
   className,
   position,
   ...props
}: NodeAppendixProps) {
   return (
      <div className={cn(appendixVariants({ position }), className)} {...props}>
         {children}
      </div>
   );
}

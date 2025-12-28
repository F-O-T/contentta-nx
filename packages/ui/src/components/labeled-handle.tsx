import { BaseHandle } from "@packages/ui/components/base-handle";
import { cn } from "@packages/ui/lib/utils";
import type { HandleProps } from "@xyflow/react";
import type { ComponentProps } from "react";

const flexDirections = {
   bottom: "flex-col-reverse justify-end",
   left: "flex-row",
   right: "flex-row-reverse justify-end",
   top: "flex-col",
};

export function LabeledHandle({
   className,
   labelClassName,
   handleClassName,
   title,
   position,
   ...props
}: HandleProps &
   ComponentProps<"div"> & {
      title: string;
      handleClassName?: string;
      labelClassName?: string;
   }) {
   const { ref, ...handleProps } = props;

   return (
      <div
         className={cn(
            "relative flex items-center",
            flexDirections[position],
            className,
         )}
         ref={ref}
         title={title}
      >
         <BaseHandle
            className={handleClassName}
            position={position}
            {...handleProps}
         />
         <span className={cn("text-foreground px-3", labelClassName)}>
            {title}
         </span>
      </div>
   );
}

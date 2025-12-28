"use client";

import { cn } from "@packages/ui/lib/utils";
import { NodeToolbar, type NodeToolbarProps } from "@xyflow/react";
import React, {
   type ComponentProps,
   createContext,
   useCallback,
   useContext,
   useState,
} from "react";

/* TOOLTIP CONTEXT ---------------------------------------------------------- */

type TooltipContextType = {
   isVisible: boolean;
   showTooltip: () => void;
   hideTooltip: () => void;
};

const TooltipContext = createContext<TooltipContextType | null>(null);

/* TOOLTIP NODE ------------------------------------------------------------- */

export function NodeTooltip({ children }: ComponentProps<"div">) {
   const [isVisible, setIsVisible] = useState(false);

   const showTooltip = useCallback(() => setIsVisible(true), []);
   const hideTooltip = useCallback(() => setIsVisible(false), []);

   return (
      <TooltipContext.Provider value={{ hideTooltip, isVisible, showTooltip }}>
         <div>{children}</div>
      </TooltipContext.Provider>
   );
}

/* TOOLTIP TRIGGER ---------------------------------------------------------- */

export function NodeTooltipTrigger(props: ComponentProps<"div">) {
   const tooltipContext = useContext(TooltipContext);
   if (!tooltipContext) {
      throw new Error("NodeTooltipTrigger must be used within NodeTooltip");
   }
   const { showTooltip, hideTooltip } = tooltipContext;

   const onMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
         props.onMouseEnter?.(e);
         showTooltip();
      },
      [props, showTooltip],
   );

   const onMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
         props.onMouseLeave?.(e);
         hideTooltip();
      },
      [props, hideTooltip],
   );

   return (
      // biome-ignore lint/a11y/noStaticElementInteractions: tooltip trigger uses mouse events for hover behavior
      <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...props} />
   );
}

/* TOOLTIP CONTENT ---------------------------------------------------------- */

// /**
//  * A component that displays the tooltip content based on visibility context.
//  */

export function NodeTooltipContent({
   children,
   position,
   className,
   ...props
}: NodeToolbarProps) {
   const tooltipContext = useContext(TooltipContext);
   if (!tooltipContext) {
      throw new Error("NodeTooltipContent must be used within NodeTooltip");
   }
   const { isVisible } = tooltipContext;

   return (
      <div>
         <NodeToolbar
            className={cn(
               "bg-primary text-primary-foreground rounded-sm p-2",
               className,
            )}
            isVisible={isVisible}
            position={position}
            tabIndex={0}
            {...props}
         >
            {children}
         </NodeToolbar>
      </div>
   );
}

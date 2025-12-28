"use client";

import { Button } from "@packages/ui/components/button";
import { Slider } from "@packages/ui/components/slider";
import { cn } from "@packages/ui/lib/utils";
import {
   Panel,
   type PanelProps,
   useReactFlow,
   useStore,
   useViewport,
} from "@xyflow/react";
import { Maximize, Minus, Plus } from "lucide-react";

export function ZoomSlider({
   className,
   orientation = "horizontal",
   ...props
}: Omit<PanelProps, "children"> & {
   orientation?: "horizontal" | "vertical";
}) {
   const { zoom } = useViewport();
   const { zoomTo, zoomIn, zoomOut, fitView } = useReactFlow();
   const minZoom = useStore((state) => state.minZoom);
   const maxZoom = useStore((state) => state.maxZoom);

   return (
      <Panel
         className={cn(
            "bg-primary-foreground text-foreground flex gap-1 rounded-md p-1",
            orientation === "horizontal" ? "flex-row" : "flex-col",
            className,
         )}
         {...props}
      >
         <div
            className={cn(
               "flex gap-1",
               orientation === "horizontal" ? "flex-row" : "flex-col-reverse",
            )}
         >
            <Button
               onClick={() => zoomOut({ duration: 300 })}
               size="icon"
               variant="ghost"
            >
               <Minus className="h-4 w-4" />
            </Button>
            <Slider
               className={cn(
                  orientation === "horizontal" ? "w-[140px]" : "h-[140px]",
               )}
               max={maxZoom}
               min={minZoom}
               onValueChange={(values: number[]) => zoomTo(values[0] ?? 1)}
               orientation={orientation}
               step={0.01}
               value={[zoom]}
            />
            <Button
               onClick={() => zoomIn({ duration: 300 })}
               size="icon"
               variant="ghost"
            >
               <Plus className="h-4 w-4" />
            </Button>
         </div>
         <Button
            className={cn(
               "tabular-nums",
               orientation === "horizontal"
                  ? "w-[140px] min-w-10"
                  : "h-[40px] w-[40px]",
            )}
            onClick={() => zoomTo(1, { duration: 300 })}
            variant="ghost"
         >
            {(100 * zoom).toFixed(0)}%
         </Button>
         <Button
            onClick={() => fitView({ duration: 300 })}
            size="icon"
            variant="ghost"
         >
            <Maximize className="h-4 w-4" />
         </Button>
      </Panel>
   );
}

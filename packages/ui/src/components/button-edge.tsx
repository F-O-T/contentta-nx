import {
   BaseEdge,
   EdgeLabelRenderer,
   type EdgeProps,
   getBezierPath,
} from "@xyflow/react";
import type { ReactNode } from "react";

export function ButtonEdge({
   sourceX,
   sourceY,
   targetX,
   targetY,
   sourcePosition,
   targetPosition,
   style = {},
   markerEnd,
   children,
}: EdgeProps & { children: ReactNode }) {
   const [edgePath, labelX, labelY] = getBezierPath({
      sourcePosition,
      sourceX,
      sourceY,
      targetPosition,
      targetX,
      targetY,
   });

   return (
      <>
         <BaseEdge markerEnd={markerEnd} path={edgePath} style={style} />
         <EdgeLabelRenderer>
            <div
               className="nodrag nopan pointer-events-auto absolute"
               style={{
                  transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
               }}
            >
               {children}
            </div>
         </EdgeLabelRenderer>
      </>
   );
}

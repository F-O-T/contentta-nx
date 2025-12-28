"use client";

import { BaseNode } from "@packages/ui/components/base-node";
import {
   Handle,
   type NodeProps,
   Position,
   useNodeId,
   useReactFlow,
} from "@xyflow/react";
import { type ReactNode, useCallback } from "react";

export type PlaceholderNodeProps = Partial<NodeProps> & {
   children?: ReactNode;
};

export function PlaceholderNode({ children }: PlaceholderNodeProps) {
   const id = useNodeId();
   const { setNodes, setEdges } = useReactFlow();

   const handleClick = useCallback(() => {
      if (!id) return;

      setEdges((edges) =>
         edges.map((edge) =>
            edge.target === id ? { ...edge, animated: false } : edge,
         ),
      );

      setNodes((nodes) => {
         const updatedNodes = nodes.map((node) => {
            if (node.id === id) {
               // Customize this function to update the node's data as needed.
               // For example, you can change the label or other properties of the node.
               return {
                  ...node,
                  data: { ...node.data, label: "Node" },
                  type: "default",
               };
            }
            return node;
         });
         return updatedNodes;
      });
   }, [id, setEdges, setNodes]);

   return (
      <BaseNode
         className="bg-card w-[150px] border-dashed border-gray-400 p-2 text-center text-gray-400 shadow-none"
         onClick={handleClick}
      >
         {children}
         <Handle
            isConnectable={false}
            position={Position.Top}
            style={{ visibility: "hidden" }}
            type="target"
         />
         <Handle
            isConnectable={false}
            position={Position.Bottom}
            style={{ visibility: "hidden" }}
            type="source"
         />
      </BaseNode>
   );
}

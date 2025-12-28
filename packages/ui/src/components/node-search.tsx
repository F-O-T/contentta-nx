import {
   Command,
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";

import {
   type BuiltInEdge,
   type Node,
   type PanelProps,
   useReactFlow,
} from "@xyflow/react";
import { useCallback, useState } from "react";

export interface NodeSearchProps extends Omit<PanelProps, "children"> {
   // The function to search for nodes, should return an array of nodes that match the search string
   // By default, it will check for lowercase string inclusion.
   onSearch?: (searchString: string) => Node[];
   // The function to select a node, should set the node as selected and fit the view to the node
   // By default, it will set the node as selected and fit the view to the node.
   onSelectNode?: (node: Node) => void;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

export function NodeSearchInternal({
   onSearch,
   onSelectNode,
   open,
   onOpenChange,
}: NodeSearchProps) {
   const [searchResults, setSearchResults] = useState<Node[]>([]);
   const [searchString, setSearchString] = useState<string>("");
   const { getNodes, fitView, setNodes } = useReactFlow<Node, BuiltInEdge>();

   const defaultOnSearch = useCallback(
      (searchString: string) => {
         const nodes = getNodes();
         return nodes.filter((node) =>
            (node.data.label as string)
               .toLowerCase()
               .includes(searchString.toLowerCase()),
         );
      },
      [getNodes],
   );

   const onChange = useCallback(
      (searchString: string) => {
         setSearchString(searchString);
         if (searchString.length > 0) {
            onOpenChange?.(true);
            const results = (onSearch || defaultOnSearch)(searchString);
            setSearchResults(results);
         }
      },
      [onSearch, onOpenChange],
   );

   const defaultOnSelectNode = useCallback(
      (node: Node) => {
         setNodes((nodes) =>
            nodes.map((n) => (n.id === node.id ? { ...n, selected: true } : n)),
         );
         fitView({ duration: 500, nodes: [node] });
      },
      [fitView, setNodes],
   );

   const onSelect = useCallback(
      (node: Node) => {
         (onSelectNode || defaultOnSelectNode)?.(node);
         setSearchString("");
         onOpenChange?.(false);
      },
      [onSelectNode, defaultOnSelectNode, onOpenChange],
   );

   return (
      <>
         <CommandInput
            onFocus={() => onOpenChange?.(true)}
            onValueChange={onChange}
            placeholder="Search nodes..."
            value={searchString}
         />

         {open && (
            <CommandList>
               {searchResults.length === 0 ? (
                  <CommandEmpty>No results found. {searchString}</CommandEmpty>
               ) : (
                  <CommandGroup heading="Nodes">
                     {searchResults.map((node) => {
                        return (
                           <CommandItem
                              key={node.id}
                              onSelect={() => onSelect(node)}
                           >
                              <span>{node.data.label as string}</span>
                           </CommandItem>
                        );
                     })}
                  </CommandGroup>
               )}
            </CommandList>
         )}
      </>
   );
}

export function NodeSearch({
   className,
   onSearch,
   onSelectNode,
   ...props
}: NodeSearchProps) {
   const [open, setOpen] = useState(false);
   return (
      <Command
         className="rounded-lg border shadow-md md:min-w-[450px]"
         shouldFilter={false}
      >
         <NodeSearchInternal
            className={className}
            onOpenChange={setOpen}
            onSearch={onSearch}
            onSelectNode={onSelectNode}
            open={open}
            {...props}
         />
      </Command>
   );
}

export interface NodeSearchDialogProps extends NodeSearchProps {
   title?: string;
}

export function NodeSearchDialog({
   className,
   onSearch,
   onSelectNode,
   open,
   onOpenChange,
   title = "Node Search",
   ...props
}: NodeSearchDialogProps) {
   return (
      <CommandDialog onOpenChange={onOpenChange} open={open}>
         <NodeSearchInternal
            className={className}
            onOpenChange={onOpenChange}
            onSearch={onSearch}
            onSelectNode={onSelectNode}
            open={open}
            {...props}
         />
      </CommandDialog>
   );
}

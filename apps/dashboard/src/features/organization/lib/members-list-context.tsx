import type React from "react";
import {
   createContext,
   useCallback,
   useContext,
   useMemo,
   useState,
} from "react";

interface MembersListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;

   roleFilter: string;
   setRoleFilter: (value: string) => void;
   searchTerm: string;
   setSearchTerm: (term: string) => void;

   clearFilters: () => void;
   hasActiveFilters: boolean;
}

const MembersListContext = createContext<MembersListContextType | undefined>(
   undefined,
);

export function MembersListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [roleFilter, setRoleFilter] = useState("all");
   const [searchTerm, setSearchTerm] = useState("");

   const hasActiveFilters = useMemo(() => {
      return roleFilter !== "all";
   }, [roleFilter]);

   const handleSelectionChange = useCallback(
      (id: string, selected: boolean) => {
         setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (selected) {
               newSet.add(id);
            } else {
               newSet.delete(id);
            }
            return newSet;
         });
      },
      [],
   );

   const clearSelection = useCallback(() => {
      setSelectedItems(new Set());
   }, []);

   const selectAll = useCallback((ids: string[]) => {
      setSelectedItems(new Set(ids));
   }, []);

   const toggleAll = useCallback((ids: string[]) => {
      setSelectedItems((prev) => {
         const allSelected = ids.every((id) => prev.has(id));
         return allSelected ? new Set() : new Set(ids);
      });
   }, []);

   const clearFilters = useCallback(() => {
      setRoleFilter("all");
      setSearchTerm("");
   }, []);

   const value = {
      clearFilters,
      clearSelection,
      handleSelectionChange,
      hasActiveFilters,
      roleFilter,
      searchTerm,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setRoleFilter,
      setSearchTerm,
      toggleAll,
   };

   return (
      <MembersListContext.Provider value={value}>
         {children}
      </MembersListContext.Provider>
   );
}

export function useMembersList() {
   const context = useContext(MembersListContext);
   if (context === undefined) {
      throw new Error(
         "useMembersList must be used within a MembersListProvider",
      );
   }
   return context;
}

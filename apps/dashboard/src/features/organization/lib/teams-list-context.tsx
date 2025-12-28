import type React from "react";
import {
   createContext,
   useCallback,
   useContext,
   useMemo,
   useState,
} from "react";

interface TeamsListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;

   searchTerm: string;
   setSearchTerm: (term: string) => void;

   clearFilters: () => void;
   hasActiveFilters: boolean;
}

const TeamsListContext = createContext<TeamsListContextType | undefined>(
   undefined,
);

export function TeamsListProvider({ children }: { children: React.ReactNode }) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [searchTerm, setSearchTerm] = useState("");

   const hasActiveFilters = useMemo(() => {
      return searchTerm.length > 0;
   }, [searchTerm]);

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
      setSearchTerm("");
   }, []);

   const value = {
      clearFilters,
      clearSelection,
      handleSelectionChange,
      hasActiveFilters,
      searchTerm,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setSearchTerm,
      toggleAll,
   };

   return (
      <TeamsListContext.Provider value={value}>
         {children}
      </TeamsListContext.Provider>
   );
}

export function useTeamsList() {
   const context = useContext(TeamsListContext);
   if (context === undefined) {
      throw new Error("useTeamsList must be used within a TeamsListProvider");
   }
   return context;
}

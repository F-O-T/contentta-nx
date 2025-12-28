import type React from "react";
import {
   createContext,
   useCallback,
   useContext,
   useMemo,
   useState,
} from "react";

interface InvitesListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;

   statusFilter: string;
   setStatusFilter: (value: string) => void;
   roleFilter: string;
   setRoleFilter: (value: string) => void;
   searchTerm: string;
   setSearchTerm: (term: string) => void;

   clearFilters: () => void;
   hasActiveFilters: boolean;
}

const InvitesListContext = createContext<InvitesListContextType | undefined>(
   undefined,
);

export function InvitesListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [statusFilter, setStatusFilter] = useState("all");
   const [roleFilter, setRoleFilter] = useState("all");
   const [searchTerm, setSearchTerm] = useState("");

   const hasActiveFilters = useMemo(() => {
      return statusFilter !== "all" || roleFilter !== "all";
   }, [statusFilter, roleFilter]);

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
      setStatusFilter("all");
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
      setStatusFilter,
      statusFilter,
      toggleAll,
   };

   return (
      <InvitesListContext.Provider value={value}>
         {children}
      </InvitesListContext.Provider>
   );
}

export function useInvitesList() {
   const context = useContext(InvitesListContext);
   if (context === undefined) {
      throw new Error(
         "useInvitesList must be used within an InvitesListProvider",
      );
   }
   return context;
}

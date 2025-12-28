import { Sheet, SheetContent } from "@packages/ui/components/sheet";
import { Store, useStore } from "@tanstack/react-store";

const sheetStore = new Store({
   children: null as React.ReactNode | null,
   isOpen: false,
});

export const useSheet = () => {
   return {
      closeSheet: () =>
         sheetStore.setState((state) => ({
            ...state,
            children: null,
            isOpen: false,
         })),
      openSheet: ({ children }: { children: React.ReactNode }) =>
         sheetStore.setState((state) => ({ ...state, children, isOpen: true })),
   };
};

export function GlobalSheet() {
   const { children, isOpen } = useStore(sheetStore);

   return (
      <Sheet
         onOpenChange={(open) => {
            sheetStore.setState((state) => ({ ...state, isOpen: open }));
         }}
         open={isOpen}
      >
         <SheetContent>{children}</SheetContent>
      </Sheet>
   );
}

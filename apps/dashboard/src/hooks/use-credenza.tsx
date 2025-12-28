import { Credenza, CredenzaContent } from "@packages/ui/components/credenza";
import { Store, useStore } from "@tanstack/react-store";

const credenzaStore = new Store({
   children: null as React.ReactNode | null,
   isOpen: false,
});

export const openCredenza = ({ children }: { children: React.ReactNode }) =>
   credenzaStore.setState((state) => ({
      ...state,
      children,
      isOpen: true,
   }));

export const closeCredenza = () =>
   credenzaStore.setState((state) => ({
      ...state,
      children: null,
      isOpen: false,
   }));

export const useCredenza = () => {
   return {
      closeCredenza,
      openCredenza,
   };
};

export function GlobalCredenza() {
   const { children, isOpen } = useStore(credenzaStore);

   return (
      <Credenza
         onOpenChange={(open) => {
            credenzaStore.setState((state) => ({ ...state, isOpen: open }));
         }}
         open={isOpen}
      >
         <CredenzaContent>{children}</CredenzaContent>
      </Credenza>
   );
}

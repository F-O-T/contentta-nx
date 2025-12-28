import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";

export function useActiveOrganization() {
   const trpc = useTRPC();

   const { data: activeOrganizationData } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const activeOrganization = activeOrganizationData.organization;
   const activeSubscription = activeOrganizationData.activeSubscription;

   if (!activeOrganization) {
      throw new Error("No active organization found");
   }

   return { activeOrganization, activeSubscription };
}

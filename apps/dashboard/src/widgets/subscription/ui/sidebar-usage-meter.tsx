import { translate } from "@packages/localization";
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from "@packages/ui/components/accordion";
import { UsageRuler } from "@packages/ui/components/animated-ruler";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTRPC } from "@/integrations/clients";

export function SidebarUsageMeter() {
   const trpc = useTRPC();
   const { data: billingInfo } = useSuspenseQuery(
      trpc.authHelpers.getBillingInfo.queryOptions(),
   );

   const meterData = useMemo(() => {
      const selectedMeter =
         billingInfo.customerState?.activeMeters?.find(
            (m) => (m?.creditedUnits ?? 0) > 0,
         ) ?? billingInfo.customerState?.activeMeters?.[0];

      const consumedUnits =
         typeof selectedMeter?.consumedUnits === "number"
            ? selectedMeter.consumedUnits
            : parseInt(selectedMeter?.consumedUnits ?? "0", 10) || 0;
      const creditedUnits =
         typeof selectedMeter?.creditedUnits === "number"
            ? selectedMeter.creditedUnits
            : parseInt(selectedMeter?.creditedUnits ?? "0", 10) || 10000;

      return {
         consumedUnits,
         creditedUnits,
         selectedMeter,
      };
   }, [billingInfo.customerState?.activeMeters]);

   const rulerDisplayLimit = 5000;
   const displayConsumed = useMemo(
      () => Math.min(meterData.consumedUnits, rulerDisplayLimit),
      [meterData.consumedUnits],
   );

   return (
      <>
         {billingInfo.billingState === "active_subscription" && (
            <Accordion collapsible defaultValue="usage" type="single">
               <AccordionItem className="px-2" value="usage">
                  <AccordionTrigger>
                     {translate("pages.profile.billing.state.active.title")}
                  </AccordionTrigger>
                  <AccordionContent className="bg-muted rounded-lg p-2">
                     <UsageRuler
                        value={displayConsumed}
                        displayMax={rulerDisplayLimit}
                        legend={translate(
                           "pages.profile.billing.state.active.legend",
                        )}
                        max={meterData.creditedUnits}
                        min={0}
                     />
                  </AccordionContent>
               </AccordionItem>
            </Accordion>
         )}
      </>
   );
}

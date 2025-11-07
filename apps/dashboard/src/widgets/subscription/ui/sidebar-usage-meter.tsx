import { translate } from "@packages/localization";
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from "@packages/ui/components/accordion";
import { UsageRuler } from "@packages/ui/components/animated-ruler";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function SidebarUsageMeterErrorFallback() {
   return (
      <Accordion collapsible defaultValue="usage" type="single">
         <AccordionItem className="px-2" value="usage">
            <AccordionTrigger>
               {translate("pages.profile.billing.state.error.title")}
            </AccordionTrigger>
            <AccordionContent className="bg-muted rounded-lg p-2">
               <div className="text-sm text-destructive">
                  {translate("pages.profile.billing.state.error.description")}
               </div>
            </AccordionContent>
         </AccordionItem>
      </Accordion>
   );
}

function SidebarUsageMeterSkeleton() {
   return (
      <Accordion collapsible defaultValue="usage" type="single">
         <AccordionItem className="px-2" value="usage">
            <AccordionTrigger>
               <Skeleton className="h-4 w-24" />
            </AccordionTrigger>
            <AccordionContent className="bg-muted rounded-lg p-2">
               <Skeleton className="h-8 w-full" />
            </AccordionContent>
         </AccordionItem>
      </Accordion>
   );
}

function SidebarUsageMeterContent() {
   const trpc = useTRPC();
   const { data: billingInfo } = useSuspenseQuery(
      trpc.subscription.getBillingInfo.queryOptions(),
   );
   const { data: meterData } = useSuspenseQuery(
      trpc.subscription.activeMeters.queryOptions(),
   );

   const rulerDisplayLimit = 5000;
   const displayConsumed = useMemo(
      () => Math.min(meterData.consumedUnits, rulerDisplayLimit),
      [meterData.consumedUnits],
   );

   return (
      <>
         {billingInfo.billingState === "active_subscription" && (
            <Accordion
               className="border rounded-lg"
               collapsible
               defaultValue="usage"
               type="single"
            >
               <AccordionItem className="px-2 " value="usage">
                  <AccordionTrigger>
                     {translate("pages.profile.billing.state.active.title")}
                  </AccordionTrigger>
                  <AccordionContent className=" p-2  ">
                     <UsageRuler
                        displayMax={rulerDisplayLimit}
                        legend={translate(
                           "pages.profile.billing.state.active.legend",
                        )}
                        max={meterData.creditedUnits}
                        min={0}
                        value={displayConsumed}
                     />
                  </AccordionContent>
               </AccordionItem>
            </Accordion>
         )}
      </>
   );
}

export function SidebarUsageMeter() {
   return (
      <ErrorBoundary FallbackComponent={SidebarUsageMeterErrorFallback}>
         <Suspense fallback={<SidebarUsageMeterSkeleton />}>
            <SidebarUsageMeterContent />
         </Suspense>
      </ErrorBoundary>
   );
}

import { translate } from "@packages/localization";
import { UsageRuler } from "@packages/ui/components/animated-ruler";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { TooltipProvider } from "@packages/ui/components/tooltip";
import { formatDate } from "@packages/utils/date";
import { formatNumberIntoCurrency } from "@packages/utils/number";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   CreditCard,
   ExternalLink,
   MoreVertical,
   TrendingUp,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

export function ProfilePageBilling() {
   const trpc = useTRPC();
   const { data: activeSubscription } = useSuspenseQuery(
      trpc.authHelpers.getActiveSubscription.queryOptions(),
   );
   const { data: customerState } = useSuspenseQuery(
      trpc.authHelpers.getCustomerState.queryOptions(),
   );

   const meterData = useMemo(() => {
      const selectedMeter =
         customerState?.activeMeters?.find(
            (m) => (m?.creditedUnits ?? 0) > 0,
         ) ?? customerState?.activeMeters?.[0];

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
   }, [customerState?.activeMeters]);

   const rulerDisplayLimit = 50000;
   const displayConsumed = useMemo(
      () => Math.min(meterData.consumedUnits, rulerDisplayLimit),
      [meterData.consumedUnits],
   );

   const goToBillingPortal = useCallback(async () => {
      return await betterAuthClient.customer.portal();
   }, []);

   const getSubscriptionDisplay = useCallback(() => {
      const amount = formatNumberIntoCurrency(
         activeSubscription?.amount ?? 0,
         activeSubscription?.currency ?? "USD",
         "en-US",
      );
      const interval = activeSubscription?.recurringInterval ?? "month";
      return `${amount} /${interval}`;
   }, [
      activeSubscription?.amount,
      activeSubscription?.currency,
      activeSubscription?.recurringInterval,
   ]);

   const getNextBillingDate = useCallback(() => {
      return activeSubscription?.currentPeriodEnd
         ? formatDate(
              new Date(activeSubscription.currentPeriodEnd),
              "DD/MM/YYYY",
           )
         : "N/A";
   }, [activeSubscription?.currentPeriodEnd]);

   return (
      <TooltipProvider>
         <Card>
            <CardHeader>
               <CardTitle>{translate("pages.profile.billing.title")}</CardTitle>
               <CardDescription>
                  {translate("pages.profile.billing.description")}
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label={translate(
                              "pages.profile.billing.actions.title",
                           )}
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="w-4 h-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                           {translate("pages.profile.billing.actions.title")}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem
                              className=" flex items-center gap-2"
                              onSelect={goToBillingPortal}
                           >
                              <ExternalLink className="size-4" />
                              <span>
                                 {translate(
                                    "pages.profile.billing.actions.portal",
                                 )}
                              </span>
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
               <ItemGroup>
                  <Item>
                     <ItemMedia variant="icon">
                        <CreditCard className="size-4" />
                     </ItemMedia>
                     <ItemContent>
                        <ItemTitle>{getSubscriptionDisplay()}</ItemTitle>
                        <ItemDescription>
                           {translate("pages.profile.billing.next-billing")}{" "}
                           {getNextBillingDate()}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />
                  <Item>
                     <ItemMedia variant="icon">
                        <TrendingUp className="size-4" />
                     </ItemMedia>
                     <ItemContent>
                        <ItemTitle>
                           {translate("pages.profile.billing.usage.title")}
                        </ItemTitle>
                        <ItemDescription>
                           {translate(
                              "pages.profile.billing.usage.description",
                           )}
                        </ItemDescription>
                     </ItemContent>
                     <UsageRuler
                        defaultValue={displayConsumed}
                        displayMax={rulerDisplayLimit}
                        legend={translate("pages.profile.billing.usage.legend")}
                        max={meterData.creditedUnits}
                        min={0}
                     />
                  </Item>
               </ItemGroup>
            </CardContent>
         </Card>
      </TooltipProvider>
   );
}

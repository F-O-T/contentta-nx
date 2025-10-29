import { translate } from "@packages/localization";
import { ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@packages/ui/components/tooltip";
import { Item, ItemDescription, ItemTitle, ItemContent } from "@packages/ui/components/item";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { SubscriptionPricingCards } from "@/widgets/subscription/ui/subscription-pricing-cards";

export function ProfilePageBilling() {
   const trpc = useTRPC();
   const { data: customerState, isLoading } = useSuspenseQuery(
      trpc.authHelpers.getCustomerState.queryOptions(),
   );
   const { data: isOwner, isLoading: isOwnerLoading } = useSuspenseQuery(
      trpc.authHelpers.isOrganizationOwner.queryOptions(),
   );
   const activeSubscription = customerState?.activeSubscriptions[0];
   const handleManageSubscription = useCallback(async () => {
      return await betterAuthClient.customer.portal();
   }, []);

   if (!isOwner) {
      return null;
   }

   if (isLoading || isOwnerLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center">
                  <div className="flex items-center gap-2">
                     {translate("pages.profile.billing.loading")}
                     <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
               </CardTitle>
               <CardDescription>
                  <Skeleton className="h-4 w-64" />
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between mb-6">
                  <div>
                     <Skeleton className="h-8 w-32 mb-2" />
                     <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <h4 className="font-medium text-foreground mb-3">
                        {translate("pages.profile.billing.plan-features")}
                     </h4>
                     <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                           <div className="flex items-center" key={i}>
                              <Skeleton className="h-4 w-4 mr-2 rounded" />
                              <Skeleton className="h-4 w-full max-w-xs" />
                           </div>
                        ))}
                     </div>
                  </div>

                  <div>
                     <h4 className="font-medium text-foreground mb-3">
                        {translate(
                           "pages.profile.billing.usage-this-month-loading",
                        )}
                     </h4>
                     <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                           <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                 <Skeleton className="h-4 w-24" />
                                 <Skeleton className="h-4 w-16" />
                              </div>
                              <Skeleton className="h-2 w-full rounded-full" />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="flex space-x-3 mt-6">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-36" />
               </div>
            </CardContent>
         </Card>
      );
   }

   if (!activeSubscription) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.profile.billing.no-active-plan")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "pages.profile.billing.no-active-plan-description",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <SubscriptionPricingCards />
            </CardContent>
         </Card>
      );
   }

   const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat("en-US", {
         currency: currency.toUpperCase(),
         style: "currency",
      }).format(amount / 100); // Assuming amount is in cents
   };

   const formatDate = (date: Date | null) => {
      if (!date) return "N/A";
      return new Intl.DateTimeFormat("en-US", {
         day: "numeric",
         month: "long",
         year: "numeric",
      }).format(new Date(date));
   };

   const computeMeterDetails = (
      meter: { consumedUnits: number; creditedUnits: number },
      subscriptionAmountCents: number,
      currency: string,
   ) => {
      const consumed = meter?.consumedUnits ?? 0;
      const credited = meter?.creditedUnits ?? 0;

      // If credited is -1 we treat it as unlimited / not priced per unit
      if (credited === -1 || credited === 0) {
         return {
            consumedAmountCents: 0,
            consumedFormatted: "—",
            perUnitCents: 0,
            perUnitFormatted: "—",
         };
      }

      // compute per-unit cost in cents (may be fractional) and total consumed amount in cents (float)
      const perUnitCentsFloat = subscriptionAmountCents / credited; // fractional cents per unit
      const consumedAmountCentsFloat = perUnitCentsFloat * consumed;

      // Format per-unit price with higher precision for very small values
      const formatCurrencyFlexible = (
         amountCents: number,
         currencyCode: string,
      ) => {
         const amountDollars = amountCents / 100;
         const absAmount = Math.abs(amountDollars);

         // If exactly zero, fall back to the normal formatter
         if (absAmount === 0) {
            return formatCurrency(Math.round(amountCents), currencyCode);
         }

         // For very small per-unit prices, show extra decimal places so value isn't rounded to $0.00
         if (absAmount < 0.01) {
            return new Intl.NumberFormat("en-US", {
               currency: currencyCode.toUpperCase(),
               maximumFractionDigits: 8,
               minimumFractionDigits: 6,
               style: "currency",
            }).format(amountDollars);
         }

         // Otherwise show regular 2-decimal currency
         return formatCurrency(Math.round(amountCents), currencyCode);
      };

      const consumedAmountCentsRounded = Math.round(consumedAmountCentsFloat);

      return {
         consumedAmountCents: consumedAmountCentsRounded,
         consumedFormatted: formatCurrency(
            consumedAmountCentsRounded,
            currency,
         ),
         perUnitCents: perUnitCentsFloat,
         perUnitFormatted: formatCurrencyFlexible(perUnitCentsFloat, currency),
      };
   };

   const calculateUsagePercentage = (consumed: number, credited: number) => {
      if (credited === 0) return 0;
      return Math.min((consumed / credited) * 100, 100);
   };


   // Compute meter details and usage percentage using the helper
   const selectedMeter =
      customerState?.activeMeters?.find((m) => (m?.creditedUnits ?? 0) > 0) ??
      customerState?.activeMeters?.[0];

   const meterDetails = selectedMeter
      ? computeMeterDetails(
         selectedMeter as { consumedUnits: number; creditedUnits: number },
         activeSubscription?.amount ?? 0,
         activeSubscription?.currency ?? "USD",
      )
      : null;

   const usagePercentage = calculateUsagePercentage(
      selectedMeter?.consumedUnits ?? 0,
      selectedMeter?.creditedUnits ?? 0,
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("pages.profile.billing.current-plan-title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.profile.billing.current-plan-description")}
            </CardDescription>
            <CardAction>
               <Tooltip >

                  <TooltipTrigger asChild>

                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleManageSubscription}
                     >
                        <ExternalLink className=" h-4 w-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                     {translate("pages.profile.billing.manage-subscription")}
                  </TooltipContent>
               </Tooltip>
            </CardAction>
         </CardHeader>
         <CardContent>
            <Card>
               <CardHeader>
                  <CardTitle>
                     {formatCurrency(
                        activeSubscription.amount,
                        activeSubscription.currency,
                     )}
                     <span className="text-muted-foreground font-normal">
                        /{activeSubscription.recurringInterval}
                     </span>
                  </CardTitle>
                  <CardDescription>
                     {translate("pages.profile.billing.next-billing")}{" "}
                     {formatDate(activeSubscription.currentPeriodEnd)}
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  {selectedMeter ? (
                     <Item variant="outline">
                        <ItemContent>
                           <ItemTitle className="flex items-center justify-between w-full">
                              {String(translate('pages.profile.billing.usage')).replace('{usage}', selectedMeter.consumedUnits.toLocaleString()).replace('{limit}', selectedMeter.creditedUnits === -1 ? '∞' : selectedMeter.creditedUnits.toLocaleString())}
                              {meterDetails?.consumedFormatted && (
                                 <span className="text-sm font-semibold text-primary ">
                                    {meterDetails.consumedFormatted}
                                 </span>
                              )}
                           </ItemTitle>
                           <ItemDescription>
                              <Progress className="h-2" value={usagePercentage} />
                           </ItemDescription>
                        </ItemContent>
                     </Item>

                  ) : (
                     <p className="text-sm text-foreground/60">
                        {translate("pages.profile.billing.no-usage-meters")}
                     </p>
                  )}
               </CardContent>
            </Card>
         </CardContent>
      </Card>
   );
}

import { translate } from "@packages/localization";
import {
   ExternalLink,
   MoreVertical,
   CreditCard,
   TrendingUp,
} from "lucide-react";
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
   ItemDescription,
   ItemTitle,
   ItemContent,
   ItemGroup,
   ItemMedia,
} from "@packages/ui/components/item";
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
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
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
         <TooltipProvider>
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
                  <CardAction>
                     <Button size="icon" variant="ghost" disabled>
                        <MoreVertical className="w-5 h-5" />
                     </Button>
                  </CardAction>
               </CardHeader>
               <CardContent>
                  <ItemGroup>
                     {[1, 2, 3].map((i) => (
                        <Item key={i}>
                           <ItemMedia variant="icon">
                              <Skeleton className="h-4 w-4 rounded" />
                           </ItemMedia>
                           <ItemContent>
                              <ItemTitle>
                                 <Skeleton className="h-4 w-32 mb-2" />
                              </ItemTitle>
                              <ItemDescription>
                                 <Skeleton className="h-4 w-48" />
                              </ItemDescription>
                           </ItemContent>
                        </Item>
                     ))}
                  </ItemGroup>
               </CardContent>
            </Card>
         </TooltipProvider>
      );
   }

   if (!activeSubscription) {
      return (
         <TooltipProvider>
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
                  <CardAction>
                     <Button size="icon" variant="ghost" disabled>
                        <MoreVertical className="w-5 h-5" />
                     </Button>
                  </CardAction>
               </CardHeader>
               <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SubscriptionPricingCards />
               </CardContent>
            </Card>
         </TooltipProvider>
      );
   }

   // Helper functions
   const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat("en-US", {
         currency: currency.toUpperCase(),
         style: "currency",
      }).format(amount / 100);
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

      if (credited === -1 || credited === 0) {
         return {
            consumedAmountCents: 0,
            consumedFormatted: "—",
            perUnitCents: 0,
            perUnitFormatted: "—",
         };
      }

      const perUnitCentsFloat = subscriptionAmountCents / credited;
      const consumedAmountCentsFloat = perUnitCentsFloat * consumed;

      const formatCurrencyFlexible = (
         amountCents: number,
         currencyCode: string,
      ) => {
         const amountDollars = amountCents / 100;
         const absAmount = Math.abs(amountDollars);

         if (absAmount === 0) {
            return formatCurrency(Math.round(amountCents), currencyCode);
         }

         if (absAmount < 0.01) {
            return new Intl.NumberFormat("en-US", {
               currency: currencyCode.toUpperCase(),
               maximumFractionDigits: 8,
               minimumFractionDigits: 6,
               style: "currency",
            }).format(amountDollars);
         }

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
      <TooltipProvider>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.profile.billing.current-plan-title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.profile.billing.current-plan-description")}
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label={translate(
                              "pages.profile.billing.manage-subscription",
                           )}
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel>
                           {translate(
                              "pages.profile.billing.manage-subscription",
                           )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem
                              onSelect={handleManageSubscription}
                           >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {translate(
                                 "pages.profile.billing.manage-subscription",
                              )}
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
                        <ItemTitle>
                           <span className="text-muted-foreground font-normal">
                              {formatCurrency(
                                 activeSubscription.amount,
                                 activeSubscription.currency,
                              )}
                              /{activeSubscription.recurringInterval}
                           </span>
                        </ItemTitle>
                        <ItemDescription>
                           {translate("pages.profile.billing.next-billing")}{" "}
                           {formatDate(activeSubscription.currentPeriodEnd)}
                        </ItemDescription>
                     </ItemContent>
                  </Item>

                  {selectedMeter && (
                     <Item>
                        <ItemMedia variant="icon">
                           <TrendingUp className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="flex items-center justify-between w-full">
                              {String(translate("pages.profile.billing.usage"))
                                 .replace(
                                    "{usage}",
                                    selectedMeter.consumedUnits.toLocaleString(),
                                 )
                                 .replace(
                                    "{limit}",
                                    selectedMeter.creditedUnits === -1
                                       ? "∞"
                                       : selectedMeter.creditedUnits.toLocaleString(),
                                 )}
                           </ItemTitle>
                           <ItemDescription>
                              <Progress
                                 className="h-2"
                                 value={usagePercentage}
                              />
                           </ItemDescription>
                        </ItemContent>
                     </Item>
                  )}

                  {!selectedMeter && (
                     <Item>
                        <ItemMedia variant="icon">
                           <TrendingUp className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>
                              {translate("pages.profile.billing.usage")}
                           </ItemTitle>
                           <ItemDescription>
                              {translate(
                                 "pages.profile.billing.no-usage-meters",
                              )}
                           </ItemDescription>
                        </ItemContent>
                     </Item>
                  )}
               </ItemGroup>
            </CardContent>
         </Card>
      </TooltipProvider>
   );
}

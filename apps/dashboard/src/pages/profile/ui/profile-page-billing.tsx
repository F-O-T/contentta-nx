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
   Building,
   CreditCard,
   ExternalLink,
   MoreVertical,
   TrendingUp,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { SubscriptionPlansCredenza } from "@/widgets/subscription/ui/subscription-plans-credenza";

export function ProfilePageBilling() {
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

   const rulerDisplayLimit = 50000;
   const displayConsumed = useMemo(
      () => Math.min(meterData.consumedUnits, rulerDisplayLimit),
      [meterData.consumedUnits],
   );

   const goToBillingPortal = useCallback(async () => {
      return await betterAuthClient.customer.portal();
   }, []);

   function OrganizationMemberContent() {
      return (
         <ItemGroup>
            <Item>
               <ItemMedia variant="icon">
                  <Building className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate(
                        "pages.profile.billing.state.organization.title",
                     )}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "pages.profile.billing.state.organization.description",
                     )}
                  </ItemDescription>
               </ItemContent>
            </Item>
         </ItemGroup>
      );
   }

   function NoSubscriptionContent() {
      return (
         <>
            <ItemGroup>
               <Item>
                  <ItemMedia variant="icon">
                     <CreditCard className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>
                        {translate(
                           "pages.profile.billing.state.not-active.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "pages.profile.billing.state.not-active.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
               </Item>
            </ItemGroup>
            <SubscriptionPlansCredenza>
               <Button className="w-full">Upgrade</Button>
            </SubscriptionPlansCredenza>
         </>
      );
   }

   function ActiveSubscriptionContent() {
      const getSubscriptionDisplay = useCallback(() => {
         const amount = formatNumberIntoCurrency(
            billingInfo.activeSubscription?.amount ?? 0,
            billingInfo.activeSubscription?.currency ?? "USD",
            "en-US",
         );
         const interval =
            billingInfo.activeSubscription?.recurringInterval ?? "month";
         return `${amount}/${interval}`;
      }, []);

      const getNextBillingDate = useCallback(() => {
         return billingInfo.activeSubscription?.currentPeriodEnd
            ? formatDate(
                 new Date(billingInfo.activeSubscription.currentPeriodEnd),
                 "DD/MM/YYYY",
              )
            : "N/A";
      }, []);

      return (
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
                     {translate("pages.profile.billing.state.active.title")}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "pages.profile.billing.state.active.description",
                     )}
                  </ItemDescription>
               </ItemContent>
               <UsageRuler
                  defaultValue={displayConsumed}
                  displayMax={rulerDisplayLimit}
                  legend={translate(
                     "pages.profile.billing.state.active.legend",
                  )}
                  max={meterData.creditedUnits}
                  min={0}
               />
            </Item>
         </ItemGroup>
      );
   }
   return (
      <TooltipProvider>
         <Card>
            <CardHeader>
               <CardTitle>{translate("pages.profile.billing.title")}</CardTitle>
               <CardDescription>
                  {translate("pages.profile.billing.description")}
               </CardDescription>
               {billingInfo.billingState === "active_subscription" && (
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
               )}
            </CardHeader>
            <CardContent>
               {billingInfo.billingState === "organization_member" && (
                  <OrganizationMemberContent />
               )}

               {billingInfo.billingState === "no_subscription" && (
                  <NoSubscriptionContent />
               )}

               {billingInfo.billingState === "active_subscription" && (
                  <ActiveSubscriptionContent />
               )}
            </CardContent>
         </Card>
      </TooltipProvider>
   );
}

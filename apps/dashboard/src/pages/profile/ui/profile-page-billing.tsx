import { translate } from "@packages/localization";
import { PlanName, STRIPE_PLANS } from "@packages/stripe/constants";
import { Badge } from "@packages/ui/components/badge";
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
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowRight, Clock, CreditCard, Crown, Zap } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";

interface Subscription {
   id: string;
   plan: string;
   status: string;
   periodStart: Date | string | null;
   periodEnd: Date | string | null;
   trialStart: Date | string | null;
   trialEnd: Date | string | null;
   cancelAtPeriodEnd: boolean;
   seats: number | null;
   referenceId: string;
}

function getStatusBadge(status: string, cancelAtPeriodEnd: boolean) {
   if (cancelAtPeriodEnd) {
      return <Badge variant="destructive">Cancelando</Badge>;
   }

   switch (status) {
      case "active":
         return (
            <Badge className="bg-green-500 hover:bg-green-500/90">Ativo</Badge>
         );
      case "trialing":
         return <Badge variant="secondary">Período de teste</Badge>;
      case "past_due":
         return <Badge variant="destructive">Pagamento pendente</Badge>;
      case "canceled":
         return <Badge variant="destructive">Cancelado</Badge>;
      default:
         return <Badge variant="outline">{status}</Badge>;
   }
}

function getDaysRemaining(date: Date | string | null): number | null {
   if (!date) return null;
   const d = new Date(date);
   const now = new Date();
   const diff = d.getTime() - now.getTime();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ProfilePageBillingErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.billing.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.billing.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.billing.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function ProfilePageBillingSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
            <CardAction>
               <Skeleton className="size-8" />
            </CardAction>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item>
                  <ItemMedia variant="icon">
                     <Skeleton className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <Skeleton className="h-5 w-1/2" />
                     <Skeleton className="h-4 w-3/4" />
                  </ItemContent>
               </Item>
               <ItemSeparator />
               <Item>
                  <ItemMedia variant="icon">
                     <Skeleton className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <Skeleton className="h-5 w-1/2" />
                     <Skeleton className="h-4 w-3/4" />
                  </ItemContent>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function ActiveSubscriptionContent({
   subscription,
}: {
   subscription: Subscription;
}) {
   const plan = STRIPE_PLANS.find(
      (p) => p.name.toLowerCase() === subscription.plan.toLowerCase(),
   );

   if (!plan) {
      return null;
   }

   const PlanIcon = plan.name === PlanName.PRO ? Crown : Zap;
   const isTrialing = subscription.status === "trialing";
   const trialDaysRemaining = isTrialing
      ? getDaysRemaining(subscription.trialEnd)
      : null;

   return (
      <div className="space-y-3">
         <Item>
            <ItemMedia className="bg-primary/10 text-primary" variant="icon">
               <PlanIcon className="size-5" />
            </ItemMedia>
            <ItemContent>
               <ItemTitle className="text-lg">{plan.displayName}</ItemTitle>
               <ItemDescription>{plan.description}</ItemDescription>
            </ItemContent>
            {getStatusBadge(
               subscription.status,
               subscription.cancelAtPeriodEnd,
            )}
         </Item>
         <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-bold">{plan.price}</span>
               <span className="text-muted-foreground">/mês</span>
            </div>
            {isTrialing && trialDaysRemaining !== null && (
               <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {trialDaysRemaining} dias restantes
               </div>
            )}
         </div>
      </div>
   );
}

function NoSubscriptionContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };

   return (
      <Empty className="border-none py-4">
         <EmptyHeader>
            <EmptyMedia variant="icon">
               <CreditCard className="size-6" />
            </EmptyMedia>
            <EmptyTitle>
               {translate(
                  "dashboard.routes.profile.billing.state.not-active.title",
               )}
            </EmptyTitle>
            <EmptyDescription>
               {translate(
                  "dashboard.routes.profile.billing.state.not-active.description",
               )}
            </EmptyDescription>
         </EmptyHeader>
         <EmptyContent>
            <Button asChild>
               <Link
                  params={{ slug }}
                  search={{ success: undefined }}
                  to="/$slug/plans"
               >
                  Upgrade Plan
                  <ArrowRight className="size-4 ml-2" />
               </Link>
            </Button>
         </EmptyContent>
      </Empty>
   );
}

function ProfilePageBillingContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };
   const navigate = useNavigate();
   const { activeSubscription } = useActiveOrganization();

   const handleNavigateToManagePlan = () => {
      navigate({ params: { slug }, to: "/$slug/manage-plan" });
   };

   if (activeSubscription) {
      return (
         <QuickAccessCard
            content={
               <ActiveSubscriptionContent
                  subscription={activeSubscription as Subscription}
               />
            }
            description={translate(
               "dashboard.routes.profile.billing.description",
            )}
            icon={<CreditCard className="size-4" />}
            onClick={handleNavigateToManagePlan}
            title={translate("dashboard.routes.profile.billing.title")}
         />
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.billing.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <NoSubscriptionContent />
         </CardContent>
      </Card>
   );
}

export function ProfilePageBilling() {
   return (
      <ErrorBoundary FallbackComponent={ProfilePageBillingErrorFallback}>
         <Suspense fallback={<ProfilePageBillingSkeleton />}>
            <ProfilePageBillingContent />
         </Suspense>
      </ErrorBoundary>
   );
}

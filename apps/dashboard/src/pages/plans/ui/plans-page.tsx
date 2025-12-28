import { translate } from "@packages/localization";
import { PlanName, STRIPE_PLANS } from "@packages/stripe/constants";
import { Badge } from "@packages/ui/components/badge";
import {
   Banner,
   BannerAction,
   BannerClose,
   BannerIcon,
   BannerTitle,
} from "@packages/ui/components/banner";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import {
   Check,
   Clock,
   Crown,
   Gift,
   Rocket,
   Sparkles,
   User,
   Zap,
} from "lucide-react";
import { Suspense, useState, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { betterAuthClient } from "@/integrations/clients";

interface Plan {
   name: string;
   displayName: string;
   price: string;
   annualPrice?: string | null;
   description: string;
   features: string[];
   icon: React.ReactNode;
   highlighted?: boolean;
   hasFreeTrial?: boolean;
   trialDays?: number;
}

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

function getDaysRemaining(date: Date | string | null): number | null {
   if (!date) return null;
   const d = new Date(date);
   const now = new Date();
   const diff = d.getTime() - now.getTime();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function UpgradeBanner({
   subscription,
}: {
   subscription: Subscription | null;
}) {
   // Don't show if already on ERP and active (not trialing)
   const isErpActive =
      subscription?.plan?.toLowerCase() === "erp" &&
      subscription?.status === "active";

   if (isErpActive) {
      return null;
   }

   const isOnBasic = subscription?.plan?.toLowerCase() === "basic";
   const isTrialing = subscription?.status === "trialing";
   const trialDays = isTrialing
      ? getDaysRemaining(subscription?.trialEnd ?? null)
      : null;

   // Determine banner content based on user state
   const getBannerContent = () => {
      if (isTrialing && trialDays !== null) {
         return {
            buttonText: "Continuar explorando",
            icon: Clock,
            message: `Aproveite seu teste! ${trialDays} ${trialDays === 1 ? "dia restante" : "dias restantes"} para explorar todos os recursos.`,
         };
      }

      if (isOnBasic) {
         return {
            buttonText: "Fazer upgrade",
            icon: Rocket,
            message:
               "Desbloqueie mais recursos! Faça upgrade para o ERP e tenha acesso a automações, centros de custo e mais.",
         };
      }

      // No subscription - new user
      return {
         buttonText: "Começar teste gratis",
         icon: Gift,
         message:
            "Comece agora! Teste o plano Basic gratis por 14 dias, sem compromisso.",
      };
   };

   const { icon, message, buttonText } = getBannerContent();

   const scrollToErpPlan = () => {
      const erpCard = document.querySelector('[data-plan="erp"]');
      erpCard?.scrollIntoView({ behavior: "smooth", block: "center" });
   };

   return (
      <Banner className="rounded-lg" inset>
         <div className="flex items-center gap-3 flex-1 min-w-0">
            <BannerIcon icon={icon} />
            <BannerTitle className="line-clamp-2 md:line-clamp-1">
               {message}
            </BannerTitle>
         </div>
         <div className="flex items-center gap-2 shrink-0">
            <BannerAction onClick={scrollToErpPlan}>{buttonText}</BannerAction>
            <BannerClose />
         </div>
      </Banner>
   );
}

const getIconForPlan = (planName: string) => {
   switch (planName) {
      case PlanName.FREE:
         return <User className="size-6" />;
      case PlanName.PRO:
         return <Crown className="size-6" />;
      default:
         return <Zap className="size-6" />;
   }
};

const getTrialDaysForPlan = (planName: string) => {
   switch (planName) {
      case PlanName.PRO:
         return 14;
      default:
         return 0;
   }
};

const plans: Plan[] = STRIPE_PLANS.map((plan) => {
   const trialDays = getTrialDaysForPlan(plan.name);
   return {
      ...plan,
      icon: getIconForPlan(plan.name),
      hasFreeTrial: trialDays > 0,
      trialDays,
   };
});

function PlansPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Falha ao carregar os planos. Tente novamente.",
      errorTitle: "Erro ao carregar planos",
      retryText: translate("common.actions.retry"),
   })(props);
}

function PlansPageSkeleton() {
   return (
      <main className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
         </div>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto w-full">
            <Skeleton className="h-[450px]" />
            <Skeleton className="h-[450px]" />
            <Skeleton className="h-[450px]" />
            <Skeleton className="h-[450px]" />
         </div>
      </main>
   );
}

function PlanCard({
   plan,
   isAnnual,
   subscription,
   onSelect,
   isLoading,
}: {
   plan: Plan;
   isAnnual: boolean;
   subscription?: Subscription | null;
   onSelect: (planName: string) => void;
   isLoading: boolean;
}) {
   const isFreePlan = plan.name === PlanName.FREE;
   const isCurrentPlan = isFreePlan
      ? !subscription || subscription?.plan?.toLowerCase() === "free"
      : subscription?.plan?.toLowerCase() === plan.name.toLowerCase();
   const isTrialing = subscription?.status === "trialing";
   const trialDaysRemaining =
      isTrialing && isCurrentPlan
         ? getDaysRemaining(subscription?.trialEnd ?? null)
         : null;
   const price = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
   const period = isFreePlan ? "" : isAnnual ? "/ano" : "/mês";

   const getButtonText = () => {
      if (isCurrentPlan) {
         if (isTrialing && trialDaysRemaining) {
            return `${trialDaysRemaining} dias restantes`;
         }
         return "Plano atual";
      }
      if (isLoading) return "Processando...";
      if (isFreePlan) return "Plano atual";
      if (isTrialing) return "Fazer upgrade";
      if (plan.hasFreeTrial && !subscription)
         return `Testar ${plan.trialDays} dias grátis`;
      return "Assinar";
   };

   return (
      <Card
         className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
            plan.highlighted
               ? "border-primary shadow-md ring-2 ring-primary/20"
               : ""
         } ${isCurrentPlan ? "border-green-500 bg-green-500/5" : ""}`}
         data-plan={plan.name.toLowerCase()}
      >
         {plan.highlighted && !isCurrentPlan && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
               <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="size-3" />
                  Mais completo
               </span>
            </div>
         )}
         {isCurrentPlan && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
               <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  {isTrialing ? (
                     <Clock className="size-3" />
                  ) : (
                     <Check className="size-3" />
                  )}
                  {isTrialing ? "Em teste" : "Plano atual"}
               </span>
            </div>
         )}
         <CardHeader className="text-center pb-2 pt-8">
            <div
               className={`mx-auto mb-4 p-3 rounded-full ${
                  plan.highlighted
                     ? "bg-primary/10 text-primary"
                     : "bg-muted text-muted-foreground"
               }`}
            >
               {plan.icon}
            </div>
            <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
            <CardDescription className="text-sm">
               {plan.description}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex-1">
            <div className="text-center mb-6">
               <span className="text-4xl font-bold">{price}</span>
               <span className="text-muted-foreground">{period}</span>
               {isAnnual && plan.annualPrice && (
                  <p className="text-xs text-green-600 mt-1">
                     Economize 2 meses
                  </p>
               )}
            </div>
            {plan.hasFreeTrial && plan.trialDays && !subscription && (
               <div className="flex justify-center mb-4">
                  <Badge className="gap-1" variant="secondary">
                     <Clock className="size-3" />
                     {plan.trialDays} dias grátis
                  </Badge>
               </div>
            )}
            <ul className="space-y-3">
               {plan.features.map((feature) => (
                  <li className="flex items-center gap-2" key={feature}>
                     <Check className="size-4 text-green-500 shrink-0" />
                     <span className="text-sm">{feature}</span>
                  </li>
               ))}
            </ul>
         </CardContent>
         <CardFooter>
            <Button
               className="w-full"
               disabled={isCurrentPlan || isLoading || isFreePlan}
               onClick={() => onSelect(plan.name)}
               variant={plan.highlighted ? "default" : "outline"}
            >
               {getButtonText()}
            </Button>
         </CardFooter>
      </Card>
   );
}

function PlansPageContent() {
   const { activeOrganization, activeSubscription } = useActiveOrganization();
   const [isAnnual, setIsAnnual] = useState(true);
   const [isLoading, startTransition] = useTransition();

   const handleSelectPlan = async (planName: string) => {
      // Don't process free plan
      if (planName === PlanName.FREE) return;

      startTransition(async () => {
         if (!activeOrganization?.id) {
            toast.error("Nenhuma organização selecionada");
            return;
         }

         try {
            const baseUrl = `${window.location.origin}${window.location.pathname}`;

            await betterAuthClient.subscription.upgrade({
               annual: isAnnual,
               cancelUrl: `${baseUrl}?cancel=true`,
               plan: planName,
               referenceId: activeOrganization?.id,
               successUrl: `${baseUrl}?success=true`,
            });
         } catch (error) {
            console.error("Failed to create checkout session:", error);
            toast.error("Falha ao iniciar checkout", {
               description: "Tente novamente mais tarde.",
            });
         }
      });
   };

   return (
      <main className="flex flex-col gap-6">
         <DefaultHeader
            description="Escolha o plano ideal para sua organização. Todos os membros terão acesso ao mesmo plano."
            title="Planos"
         />

         <UpgradeBanner
            subscription={activeSubscription as Subscription | null}
         />

         <div className="flex justify-center mb-4">
            <ToggleGroup
               className="bg-muted p-1 rounded-lg"
               onValueChange={(value) => {
                  if (value) setIsAnnual(value === "annual");
               }}
               type="single"
               value={isAnnual ? "annual" : "monthly"}
            >
               <ToggleGroupItem className="px-4 py-2 text-sm" value="monthly">
                  Mensal
               </ToggleGroupItem>
               <ToggleGroupItem className="px-4 py-2 text-sm" value="annual">
                  Anual
                  <span className="ml-1 text-xs text-green-600">-17%</span>
               </ToggleGroupItem>
            </ToggleGroup>
         </div>

         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto w-full">
            {plans.map((plan) => (
               <PlanCard
                  isAnnual={isAnnual}
                  isLoading={isLoading}
                  key={plan.name}
                  onSelect={handleSelectPlan}
                  plan={plan}
                  subscription={activeSubscription as Subscription | null}
               />
            ))}
         </div>

         <p className="text-center text-sm text-muted-foreground mt-4">
            Todos os planos incluem SSL, backups automáticos e suporte técnico.
         </p>
      </main>
   );
}

export function PlansPage() {
   return (
      <ErrorBoundary FallbackComponent={PlansPageErrorFallback}>
         <Suspense fallback={<PlansPageSkeleton />}>
            <PlansPageContent />
         </Suspense>
      </ErrorBoundary>
   );
}

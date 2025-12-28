import { translate } from "@packages/localization";
import { PlanName, STRIPE_PLANS } from "@packages/stripe/constants";
import { Badge } from "@packages/ui/components/badge";
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
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
   AlertCircle,
   ArrowRight,
   Calendar,
   Check,
   Clock,
   CreditCard,
   Crown,
   ExternalLink,
   Zap,
} from "lucide-react";
import { Suspense, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { betterAuthClient } from "@/integrations/clients";

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

function formatDate(date: Date | string | null): string {
   if (!date) return "-";
   const d = new Date(date);
   return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
   });
}

function getDaysRemaining(date: Date | string | null): number | null {
   if (!date) return null;
   const d = new Date(date);
   const now = new Date();
   const diff = d.getTime() - now.getTime();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ManagePlanPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Falha ao carregar o plano. Tente novamente.",
      errorTitle: "Erro ao carregar plano",
      retryText: translate("common.actions.retry"),
   })(props);
}

function ManagePlanPageSkeleton() {
   return (
      <main className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
         </div>
         <div className="max-w-2xl mx-auto w-full">
            <Skeleton className="h-[350px]" />
         </div>
      </main>
   );
}

function ManagePlanPageContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };
   const { activeOrganization, activeSubscription } = useActiveOrganization();
   const [isLoading, startTransition] = useTransition();

   if (!activeSubscription) {
      return null;
   }

   const subscription = activeSubscription as Subscription;
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

   const handleManageSubscription = () => {
      startTransition(async () => {
         if (!activeOrganization?.id) {
            toast.error("Nenhuma organização selecionada");
            return;
         }

         try {
            const { data } = await betterAuthClient.subscription.billingPortal({
               referenceId: activeOrganization.id,
               returnUrl: window.location.href,
            });

            if (data?.url) {
               window.location.href = data.url;
            } else {
               toast.error("Falha ao abrir portal de cobrança", {
                  description: "Tente novamente mais tarde.",
               });
            }
         } catch (error) {
            console.error("Failed to open billing portal:", error);
            toast.error("Falha ao abrir portal de cobrança", {
               description: "Tente novamente mais tarde.",
            });
         }
      });
   };

   return (
      <main className="flex flex-col gap-6">
         <DefaultHeader
            description="Gerencie sua assinatura, atualize seu plano ou altere seus dados de pagamento."
            title="Gerenciar Plano"
         />

         <div className="max-w-2xl mx-auto w-full">
            <Card className="relative border-primary shadow-md ring-2 ring-primary/20">
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

               <CardHeader className="text-center pb-2 pt-8">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary">
                     <PlanIcon className="size-6" />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                     <CardTitle className="text-2xl">
                        {plan.displayName}
                     </CardTitle>
                     {getStatusBadge(
                        subscription.status,
                        subscription.cancelAtPeriodEnd,
                     )}
                  </div>
                  <CardDescription className="text-sm">
                     {plan.description}
                  </CardDescription>
               </CardHeader>

               <CardContent className="space-y-6">
                  <div className="text-center">
                     <span className="text-4xl font-bold">{plan.price}</span>
                     <span className="text-muted-foreground">/mês</span>
                  </div>

                  <Separator />

                  <ItemGroup>
                     <Item variant="muted">
                        <ItemMedia variant="icon">
                           <CreditCard className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>Valor</ItemTitle>
                           <ItemDescription>{plan.price}/mês</ItemDescription>
                        </ItemContent>
                     </Item>
                     <ItemSeparator />
                     <Item variant="muted">
                        <ItemMedia variant="icon">
                           <Calendar className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>
                              {isTrialing
                                 ? "Teste termina em"
                                 : "Próximo pagamento"}
                           </ItemTitle>
                           <ItemDescription>
                              {isTrialing
                                 ? trialDaysRemaining !== null
                                    ? `${trialDaysRemaining} dias (${formatDate(subscription.trialEnd)})`
                                    : formatDate(subscription.trialEnd)
                                 : formatDate(subscription.periodEnd)}
                           </ItemDescription>
                        </ItemContent>
                     </Item>
                     {subscription.cancelAtPeriodEnd && (
                        <>
                           <ItemSeparator />
                           <Item variant="muted">
                              <ItemMedia variant="icon">
                                 <AlertCircle className="size-4 text-destructive" />
                              </ItemMedia>
                              <ItemContent>
                                 <ItemTitle className="text-destructive">
                                    Assinatura será cancelada
                                 </ItemTitle>
                                 <ItemDescription>
                                    Acesso até{" "}
                                    {formatDate(subscription.periodEnd)}
                                 </ItemDescription>
                              </ItemContent>
                           </Item>
                        </>
                     )}
                  </ItemGroup>

                  <Separator />

                  <div>
                     <h4 className="text-sm font-medium mb-3">
                        Recursos incluídos
                     </h4>
                     <ul className="space-y-2">
                        {plan.features.map((feature) => (
                           <li
                              className="flex items-center gap-2"
                              key={feature}
                           >
                              <Check className="size-4 text-green-500 shrink-0" />
                              <span className="text-sm">{feature}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </CardContent>

               <CardFooter className="flex flex-col gap-3">
                  <Button
                     className="w-full"
                     disabled={isLoading}
                     onClick={handleManageSubscription}
                  >
                     {isLoading ? (
                        "Abrindo..."
                     ) : (
                        <>
                           <CreditCard className="size-4 mr-2" />
                           Gerenciar Assinatura
                           <ExternalLink className="size-4 ml-2" />
                        </>
                     )}
                  </Button>

                  <Button asChild className="w-full" variant="outline">
                     <Link
                        params={{ slug }}
                        search={{ success: undefined }}
                        to="/$slug/plans"
                     >
                        Alterar Plano
                        <ArrowRight className="size-4 ml-2" />
                     </Link>
                  </Button>
               </CardFooter>
            </Card>
         </div>
      </main>
   );
}

export function ManagePlanPage() {
   return (
      <ErrorBoundary FallbackComponent={ManagePlanPageErrorFallback}>
         <Suspense fallback={<ManagePlanPageSkeleton />}>
            <ManagePlanPageContent />
         </Suspense>
      </ErrorBoundary>
   );
}

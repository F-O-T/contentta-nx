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
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
   AlertCircle,
   ArrowRight,
   Calendar,
   Check,
   Clock,
   CreditCard,
   Crown,
   Download,
   ExternalLink,
   FileText,
   Gift,
   Receipt,
   Rocket,
   Zap,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { StripeDataDisclosure } from "@/features/stripe-disclosure/stripe-data-disclosure";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { trpc } from "@/integrations/clients";

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

function getInvoiceStatusBadge(status: string | null) {
   switch (status) {
      case "paid":
         return (
            <Badge className="bg-green-500 hover:bg-green-500/90">Pago</Badge>
         );
      case "open":
         return <Badge variant="secondary">Em aberto</Badge>;
      case "void":
         return <Badge variant="outline">Anulado</Badge>;
      case "uncollectible":
         return <Badge variant="destructive">Não cobrável</Badge>;
      default:
         return <Badge variant="outline">{status || "Desconhecido"}</Badge>;
   }
}

function formatDate(date: Date | string | number | null): string {
   if (!date) return "-";
   const d = typeof date === "number" ? new Date(date * 1000) : new Date(date);
   return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
   });
}

function formatShortDate(date: Date | string | number | null): string {
   if (!date) return "-";
   const d = typeof date === "number" ? new Date(date * 1000) : new Date(date);
   return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
   });
}

function formatCurrency(amount: number, currency: string): string {
   return new Intl.NumberFormat("pt-BR", {
      currency: currency.toUpperCase(),
      style: "currency",
   }).format(amount / 100);
}

function getDaysRemaining(date: Date | string | number | null): number | null {
   if (!date) return null;
   const d = typeof date === "number" ? new Date(date * 1000) : new Date(date);
   const now = new Date();
   const diff = d.getTime() - now.getTime();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================
// Upgrade Banner Component
// ============================================

function UpgradeBanner({
   subscription,
}: {
   subscription: Subscription | null;
}) {
   const { slug } = useParams({ strict: false }) as { slug: string };

   // Don't show if already on Pro and active (not trialing)
   const isProActive =
      subscription?.plan?.toLowerCase() === "pro" &&
      subscription?.status === "active";

   if (isProActive) {
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
            buttonText: "Ver planos",
            icon: Clock,
            message: `Aproveite seu teste! ${trialDays} ${trialDays === 1 ? "dia restante" : "dias restantes"} para explorar todos os recursos Pro.`,
         };
      }

      if (isOnBasic) {
         return {
            buttonText: "Fazer upgrade",
            icon: Rocket,
            message:
               "Desbloqueie mais recursos! Faça upgrade para o Pro e tenha acesso a relatórios avançados.",
         };
      }

      // No subscription - new user
      return {
         buttonText: "Ver planos",
         icon: Gift,
         message:
            "Comece agora! Teste o plano Pro gratis por 14 dias, sem compromisso.",
      };
   };

   const { icon, message, buttonText } = getBannerContent();

   return (
      <Banner className="rounded-lg" inset>
         <div className="flex items-center gap-3 flex-1 min-w-0">
            <BannerIcon icon={icon} />
            <BannerTitle className="line-clamp-2 md:line-clamp-1">
               {message}
            </BannerTitle>
         </div>
         <div className="flex items-center gap-2 shrink-0">
            <BannerAction asChild>
               <Link
                  params={{ slug }}
                  search={{ success: undefined }}
                  to="/$slug/plans"
               >
                  {buttonText}
               </Link>
            </BannerAction>
            <BannerClose />
         </div>
      </Banner>
   );
}

// ============================================
// Error and Loading States
// ============================================

function BillingSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.billing.description")}
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

function BillingSectionSkeleton() {
   return (
      <div className="space-y-4 md:space-y-6">
         {/* Top Row */}
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <Card>
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                        <div className="flex items-center gap-4">
                           <Skeleton className="size-12 rounded-full" />
                           <div className="space-y-2 flex-1">
                              <Skeleton className="h-5 w-24" />
                              <Skeleton className="h-4 w-32" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-3/4" />
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
            <Card>
               <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
               </CardHeader>
               <CardContent>
                  <div className="space-y-3">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-2/3" />
                     <Skeleton className="h-10 w-full" />
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Bottom Row */}
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <Card>
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                           <Skeleton className="h-16 w-full" key={i} />
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </div>
            <Card>
               <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
               </CardHeader>
               <CardContent>
                  <div className="space-y-3">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-20 w-full" />
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

// ============================================
// Plan Card Component
// ============================================

function BillingPlanCard({ subscription }: { subscription: Subscription }) {
   const { slug } = useParams({ strict: false }) as { slug: string };
   const navigate = useNavigate();

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

   const handleNavigateToManagePlan = () => {
      navigate({ params: { slug }, to: "/$slug/manage-plan" });
   };

   return (
      <Card className="h-full">
         <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
               <CardTitle>Plano Atual</CardTitle>
               {getStatusBadge(
                  subscription.status,
                  subscription.cancelAtPeriodEnd,
               )}
            </div>
            <CardDescription>
               Gerencie os detalhes do seu plano de assinatura e recursos
               incluídos
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 md:gap-4">
               <div className="flex size-10 md:size-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <PlanIcon className="size-5 md:size-6 text-primary" />
               </div>
               <div className="min-w-0 flex-1">
                  <h3 className="text-lg md:text-xl font-semibold truncate">
                     {plan.displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                     {plan.description}
                  </p>
               </div>
            </div>

            {isTrialing && trialDaysRemaining !== null && (
               <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                     {trialDaysRemaining} dias restantes do período de teste
                  </span>
               </div>
            )}

            {subscription.cancelAtPeriodEnd && (
               <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
                  <AlertCircle className="size-4 text-destructive shrink-0" />
                  <span className="text-sm text-destructive">
                     Assinatura será cancelada em{" "}
                     {formatDate(subscription.periodEnd)}
                  </span>
               </div>
            )}

            <div className="space-y-2">
               <h4 className="text-sm font-medium">Recursos incluídos:</h4>
               <ul className="grid gap-2 sm:grid-cols-2">
                  {plan.features.map((feature) => (
                     <li
                        className="flex items-center gap-2 text-sm"
                        key={feature}
                     >
                        <Check className="size-4 text-green-500 shrink-0" />
                        <span className="truncate">{feature}</span>
                     </li>
                  ))}
               </ul>
            </div>

            <Button
               className="w-full"
               onClick={handleNavigateToManagePlan}
               variant="outline"
            >
               {translate("dashboard.routes.settings.billing.manage-plan")}
            </Button>
         </CardContent>
      </Card>
   );
}

// ============================================
// Summary Component
// ============================================

function BillingSummary({ subscription }: { subscription: Subscription }) {
   const { slug } = useParams({ strict: false }) as { slug: string };

   const plan = STRIPE_PLANS.find(
      (p) => p.name.toLowerCase() === subscription.plan.toLowerCase(),
   );

   if (!plan) {
      return null;
   }

   const isTrialing = subscription.status === "trialing";

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Resumo de Cobrança</CardTitle>
            <CardDescription>
               Visão geral dos custos da sua assinatura mensal
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <CreditCard className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{plan.displayName}</ItemTitle>
                     <ItemDescription>Cobrança mensal</ItemDescription>
                  </ItemContent>
                  <span className="font-medium text-sm md:text-base">
                     {plan.price}
                  </span>
               </Item>
            </ItemGroup>

            <div className="border-t pt-4">
               <div className="flex items-center justify-between">
                  <span className="text-base md:text-lg font-semibold">
                     Total
                  </span>
                  <div className="text-right">
                     <span className="text-xl md:text-2xl font-bold">
                        {plan.price}
                     </span>
                     <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
               </div>
               {isTrialing && (
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground">
                     Cobrança iniciará após o período de teste
                  </p>
               )}
            </div>

            <Button asChild className="w-full">
               <Link
                  params={{ slug }}
                  search={{ success: undefined }}
                  to="/$slug/plans"
               >
                  Alterar Plano
                  <ArrowRight className="ml-2 size-4" />
               </Link>
            </Button>
         </CardContent>
      </Card>
   );
}

// ============================================
// Payment History Component
// ============================================

function BillingPaymentHistorySkeleton() {
   return (
      <div className="space-y-3">
         {[1, 2, 3].map((i) => (
            <Skeleton className="h-16 w-full rounded-lg" key={i} />
         ))}
      </div>
   );
}

function InvoiceMobileCard({
   invoice,
}: {
   invoice: {
      id: string;
      number: string | null;
      amountPaid: number;
      currency: string;
      status: string | null;
      created: number;
      invoicePdf: string | null;
      hostedInvoiceUrl: string | null;
   };
}) {
   return (
      <div className="rounded-lg border p-3 space-y-3">
         <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
               <div className="flex size-9 items-center justify-center rounded-full bg-muted shrink-0">
                  <FileText className="size-4 text-muted-foreground" />
               </div>
               <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                     {invoice.number || `#${invoice.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {formatShortDate(invoice.created)}
                  </p>
               </div>
            </div>
            {getInvoiceStatusBadge(invoice.status)}
         </div>
         <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
               {formatCurrency(invoice.amountPaid, invoice.currency)}
            </span>
            <div className="flex items-center gap-1">
               {invoice.invoicePdf && (
                  <Button asChild size="sm" variant="ghost">
                     <a
                        href={invoice.invoicePdf}
                        rel="noopener noreferrer"
                        target="_blank"
                     >
                        <Download className="size-4" />
                     </a>
                  </Button>
               )}
               {invoice.hostedInvoiceUrl && (
                  <Button asChild size="sm" variant="ghost">
                     <a
                        href={invoice.hostedInvoiceUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                     >
                        <ExternalLink className="size-4" />
                     </a>
                  </Button>
               )}
            </div>
         </div>
      </div>
   );
}

function BillingPaymentHistoryContent() {
   const isMobile = useIsMobile();
   const { data: invoices } = useSuspenseQuery(
      trpc.billing.getInvoices.queryOptions({ limit: 10 }),
   );

   if (!invoices || invoices.length === 0) {
      return (
         <Empty className="border-none py-4">
            <EmptyHeader>
               <EmptyMedia variant="icon">
                  <Receipt className="size-6" />
               </EmptyMedia>
               <EmptyTitle>Nenhuma fatura encontrada</EmptyTitle>
               <EmptyDescription>
                  Suas faturas aparecerão aqui após o primeiro pagamento
               </EmptyDescription>
            </EmptyHeader>
         </Empty>
      );
   }

   if (isMobile) {
      return (
         <div className="space-y-3">
            {invoices.map((invoice) => (
               <InvoiceMobileCard invoice={invoice} key={invoice.id} />
            ))}
         </div>
      );
   }

   return (
      <div className="rounded-lg border overflow-hidden">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                     <TableCell className="font-medium">
                        {invoice.number || invoice.id.slice(0, 8)}
                     </TableCell>
                     <TableCell>
                        {formatCurrency(invoice.amountPaid, invoice.currency)}
                     </TableCell>
                     <TableCell>
                        {getInvoiceStatusBadge(invoice.status)}
                     </TableCell>
                     <TableCell>{formatShortDate(invoice.created)}</TableCell>
                     <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                           {invoice.invoicePdf && (
                              <Button asChild size="sm" variant="ghost">
                                 <a
                                    href={invoice.invoicePdf}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                 >
                                    <Download className="size-4" />
                                 </a>
                              </Button>
                           )}
                           {invoice.hostedInvoiceUrl && (
                              <Button asChild size="sm" variant="ghost">
                                 <a
                                    href={invoice.hostedInvoiceUrl}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                 >
                                    <ExternalLink className="size-4" />
                                 </a>
                              </Button>
                           )}
                        </div>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
   );
}

function BillingPaymentHistory() {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>
               Visualize e baixe suas faturas e pagamentos anteriores
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ErrorBoundary
               fallback={
                  <Empty className="border-none py-4">
                     <EmptyHeader>
                        <EmptyMedia variant="icon">
                           <AlertCircle className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>Erro ao carregar faturas</EmptyTitle>
                        <EmptyDescription>
                           Não foi possível carregar o histórico de pagamentos
                        </EmptyDescription>
                     </EmptyHeader>
                  </Empty>
               }
            >
               <Suspense fallback={<BillingPaymentHistorySkeleton />}>
                  <BillingPaymentHistoryContent />
               </Suspense>
            </ErrorBoundary>
         </CardContent>
      </Card>
   );
}

// ============================================
// Next Payment Component
// ============================================

function BillingNextPaymentSkeleton() {
   return (
      <div className="space-y-4">
         <Skeleton className="h-14 w-full rounded-lg" />
         <Skeleton className="h-24 w-full rounded-lg" />
      </div>
   );
}

function BillingNextPaymentContent() {
   const { data: upcomingInvoice } = useSuspenseQuery(
      trpc.billing.getUpcomingInvoice.queryOptions(),
   );

   if (!upcomingInvoice) {
      return (
         <Empty className="border-none py-4">
            <EmptyHeader>
               <EmptyMedia variant="icon">
                  <Calendar className="size-6" />
               </EmptyMedia>
               <EmptyTitle>Sem cobrança futura</EmptyTitle>
               <EmptyDescription>
                  Nenhuma cobrança programada no momento
               </EmptyDescription>
            </EmptyHeader>
         </Empty>
      );
   }

   const daysUntil = getDaysRemaining(upcomingInvoice.nextPaymentAttempt);

   return (
      <div className="space-y-4">
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Calendar className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Data da cobrança</ItemTitle>
                  <ItemDescription>
                     {formatDate(upcomingInvoice.nextPaymentAttempt)}
                  </ItemDescription>
               </ItemContent>
            </Item>
         </ItemGroup>

         <div className="rounded-lg bg-secondary/50 p-4 text-center">
            <p className="text-xs md:text-sm text-muted-foreground mb-1">
               Valor a ser cobrado
            </p>
            <p className="text-2xl md:text-3xl font-bold">
               {formatCurrency(
                  upcomingInvoice.amountDue,
                  upcomingInvoice.currency,
               )}
            </p>
            {daysUntil !== null && daysUntil > 0 && (
               <Badge className="mt-2" variant="secondary">
                  em {daysUntil} {daysUntil === 1 ? "dia" : "dias"}
               </Badge>
            )}
         </div>

         {upcomingInvoice.lines.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs md:text-sm font-medium text-muted-foreground">
                  Detalhes:
               </p>
               <ItemGroup>
                  {upcomingInvoice.lines.map(
                     (line: {
                        description: string | null;
                        amount: number;
                        quantity: number | null;
                     }) => (
                        <Item
                           key={`${line.description}-${line.amount}`}
                           variant="muted"
                        >
                           <ItemContent>
                              <ItemTitle className="text-sm">
                                 {line.description || "Item"}
                              </ItemTitle>
                           </ItemContent>
                           <span className="text-sm font-medium">
                              {formatCurrency(
                                 line.amount,
                                 upcomingInvoice.currency,
                              )}
                           </span>
                        </Item>
                     ),
                  )}
               </ItemGroup>
            </div>
         )}
      </div>
   );
}

function BillingNextPayment() {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Próximo Pagamento</CardTitle>
            <CardDescription>
               Informações sobre a sua próxima cobrança agendada
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ErrorBoundary
               fallback={
                  <Empty className="border-none py-4">
                     <EmptyHeader>
                        <EmptyMedia variant="icon">
                           <AlertCircle className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>Erro ao carregar</EmptyTitle>
                        <EmptyDescription>
                           Não foi possível carregar informações de cobrança
                        </EmptyDescription>
                     </EmptyHeader>
                  </Empty>
               }
            >
               <Suspense fallback={<BillingNextPaymentSkeleton />}>
                  <BillingNextPaymentContent />
               </Suspense>
            </ErrorBoundary>
         </CardContent>
      </Card>
   );
}

// ============================================
// No Subscription Content
// ============================================

function NoSubscriptionContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.billing.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
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
                        {translate("dashboard.routes.settings.billing.upgrade")}
                        <ArrowRight className="ml-2 size-4" />
                     </Link>
                  </Button>
               </EmptyContent>
            </Empty>
         </CardContent>
      </Card>
   );
}

// ============================================
// Main Content Component
// ============================================

function BillingSectionContent() {
   const { activeSubscription } = useActiveOrganization();

   if (!activeSubscription) {
      return (
         <div className="space-y-4 md:space-y-6">
            <StripeDataDisclosure />
            <UpgradeBanner subscription={null} />
            <NoSubscriptionContent />
         </div>
      );
   }

   const subscription = activeSubscription as Subscription;

   return (
      <div className="space-y-4 md:space-y-6">
         <StripeDataDisclosure />
         <UpgradeBanner subscription={subscription} />

         {/* Top Row: Plan Card + Summary */}
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <BillingPlanCard subscription={subscription} />
            </div>
            <BillingSummary subscription={subscription} />
         </div>

         {/* Bottom Row: Payment History + Next Payment */}
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <BillingPaymentHistory />
            </div>
            <BillingNextPayment />
         </div>
      </div>
   );
}

// ============================================
// Exported Component
// ============================================

export function BillingSection() {
   return (
      <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
         <Suspense fallback={<BillingSectionSkeleton />}>
            <BillingSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}

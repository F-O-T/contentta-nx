import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import {
   AlertTriangle,
   Bell,
   BellOff,
   BellRing,
   CreditCard,
   Loader2,
   Receipt,
   ShieldOff,
   Smartphone,
   Wallet,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface NotificationPreferences {
   budgetAlerts: boolean;
   billReminders: boolean;
   overdueAlerts: boolean;
   transactionAlerts: boolean;
}

function NotificationsSectionSkeleton() {
   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Notification Types Card Skeleton */}
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Overview Card Skeleton */}
            <Card className="h-full">
               <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4 text-center">
                     <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                     <Skeleton className="h-8 w-16 mx-auto mb-2" />
                     <Skeleton className="h-5 w-24 mx-auto" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

function NotificationsSectionErrorFallback(props: FallbackProps) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.notifications.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.settings.notifications.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Não foi possível carregar as configurações de notificações. Tente novamente.",
               errorTitle: "Erro ao carregar notificações",
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

// ============================================
// Empty State Card (for unsupported/blocked/not configured)
// ============================================

function NotificationsEmptyState({
   icon: Icon,
   title,
   description,
}: {
   icon: React.ComponentType<{ className?: string }>;
   title: string;
   description: string;
}) {
   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <CardTitle>
                        {translate(
                           "dashboard.routes.settings.notifications.title",
                        )}
                     </CardTitle>
                     <CardDescription>
                        Configure como você deseja receber alertas e lembretes
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Empty className="border-none py-4">
                        <EmptyHeader>
                           <EmptyMedia variant="icon">
                              <Icon className="size-6" />
                           </EmptyMedia>
                           <EmptyTitle>{title}</EmptyTitle>
                           <EmptyDescription>{description}</EmptyDescription>
                        </EmptyHeader>
                     </Empty>
                  </CardContent>
               </Card>
            </div>

            <Card className="h-full">
               <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>Situação das notificações</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4 text-center">
                     <p className="text-xs md:text-sm text-muted-foreground mb-1">
                        Notificações
                     </p>
                     <div className="flex items-center justify-center gap-2">
                        <BellOff className="size-5 text-muted-foreground" />
                        <span className="text-lg font-semibold text-muted-foreground">
                           Indisponível
                        </span>
                     </div>
                     <Badge className="mt-2" variant="secondary">
                        Ação necessária
                     </Badge>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

// ============================================
// Notification Types Card Component
// ============================================

function NotificationTypesCard({
   preferences,
   isLoadingPrefs,
   isUpdating,
   updatePreference,
}: {
   preferences: NotificationPreferences;
   isLoadingPrefs: boolean;
   isUpdating: boolean;
   updatePreference: (
      key: keyof NotificationPreferences,
      value: boolean,
   ) => void;
}) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.notifications.title")}
            </CardTitle>
            <CardDescription>
               Configure como você deseja receber alertas e lembretes
               importantes
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {/* Budget Alerts */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Wallet className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.notifications.items.budget.title",
                        )}
                     </ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {translate(
                           "dashboard.routes.settings.notifications.items.budget.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {isLoadingPrefs || isUpdating ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                     ) : (
                        <Switch
                           aria-label={translate(
                              "dashboard.routes.settings.notifications.items.budget.title",
                           )}
                           checked={preferences.budgetAlerts}
                           onCheckedChange={(v) =>
                              updatePreference("budgetAlerts", v)
                           }
                        />
                     )}
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Bill Reminders */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Receipt className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.notifications.items.bills.title",
                        )}
                     </ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {translate(
                           "dashboard.routes.settings.notifications.items.bills.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {isLoadingPrefs || isUpdating ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                     ) : (
                        <Switch
                           aria-label={translate(
                              "dashboard.routes.settings.notifications.items.bills.title",
                           )}
                           checked={preferences.billReminders}
                           onCheckedChange={(v) =>
                              updatePreference("billReminders", v)
                           }
                        />
                     )}
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Overdue Alerts */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <AlertTriangle className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.notifications.items.overdue.title",
                        )}
                     </ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {translate(
                           "dashboard.routes.settings.notifications.items.overdue.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {isLoadingPrefs || isUpdating ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                     ) : (
                        <Switch
                           aria-label={translate(
                              "dashboard.routes.settings.notifications.items.overdue.title",
                           )}
                           checked={preferences.overdueAlerts}
                           onCheckedChange={(v) =>
                              updatePreference("overdueAlerts", v)
                           }
                        />
                     )}
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Transaction Alerts */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <CreditCard className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.notifications.items.transactions.title",
                        )}
                     </ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {translate(
                           "dashboard.routes.settings.notifications.items.transactions.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {isLoadingPrefs || isUpdating ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                     ) : (
                        <Switch
                           aria-label={translate(
                              "dashboard.routes.settings.notifications.items.transactions.title",
                           )}
                           checked={preferences.transactionAlerts}
                           onCheckedChange={(v) =>
                              updatePreference("transactionAlerts", v)
                           }
                        />
                     )}
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// Notification Overview Card Component
// ============================================

function NotificationOverviewCard({
   isEnabled,
   isLoading,
   toggle,
   activeCount,
}: {
   isEnabled: boolean;
   isLoading: boolean;
   toggle: () => void;
   activeCount: number;
}) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Controle</CardTitle>
            <CardDescription>
               Ative ou desative todas as notificações
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
               <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  Notificações ativas
               </p>
               <p className="text-3xl md:text-4xl font-bold">
                  {isEnabled ? activeCount : 0}
               </p>
               <Badge className="mt-2" variant="secondary">
                  <Bell className="size-3 mr-1" />
                  de 4 tipos
               </Badge>
            </div>

            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     {isEnabled ? (
                        <BellRing className="size-4" />
                     ) : (
                        <BellOff className="size-4" />
                     )}
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.notifications.items.enable.title",
                        )}
                     </ItemTitle>
                     <ItemDescription className="line-clamp-2">
                        {isEnabled
                           ? translate(
                                "dashboard.routes.settings.notifications.items.enable.enabled",
                             )
                           : translate(
                                "dashboard.routes.settings.notifications.items.enable.disabled",
                             )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {isLoading ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                     ) : (
                        <Switch
                           aria-label={translate(
                              "dashboard.routes.settings.notifications.items.enable.title",
                           )}
                           checked={isEnabled}
                           onCheckedChange={toggle}
                        />
                     )}
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// Main Content Component
// ============================================

function NotificationsSectionContent() {
   const {
      isSupported,
      isEnabled,
      isLoading,
      isPushEnabled,
      permission,
      toggle,
   } = usePushNotifications();

   const {
      preferences,
      isLoading: isLoadingPrefs,
      isUpdating,
      updatePreference,
   } = useNotificationPreferences();

   if (!isSupported) {
      return (
         <NotificationsEmptyState
            description={translate(
               "dashboard.routes.settings.notifications.not-supported",
            )}
            icon={Smartphone}
            title="Navegador não suportado"
         />
      );
   }

   if (!isPushEnabled) {
      return (
         <NotificationsEmptyState
            description={translate(
               "dashboard.routes.settings.notifications.not-configured",
            )}
            icon={BellOff}
            title="Notificações não configuradas"
         />
      );
   }

   if (permission === "denied") {
      return (
         <NotificationsEmptyState
            description={translate(
               "dashboard.routes.settings.notifications.blocked",
            )}
            icon={ShieldOff}
            title="Notificações bloqueadas"
         />
      );
   }

   // Count active notification types
   const activeCount = [
      preferences.budgetAlerts,
      preferences.billReminders,
      preferences.overdueAlerts,
      preferences.transactionAlerts,
   ].filter(Boolean).length;

   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <NotificationTypesCard
                  isLoadingPrefs={isLoadingPrefs}
                  isUpdating={isUpdating}
                  preferences={preferences}
                  updatePreference={updatePreference}
               />
            </div>
            <NotificationOverviewCard
               activeCount={activeCount}
               isEnabled={isEnabled}
               isLoading={isLoading}
               toggle={toggle}
            />
         </div>
      </div>
   );
}

export function NotificationsSection() {
   return (
      <ErrorBoundary FallbackComponent={NotificationsSectionErrorFallback}>
         <Suspense fallback={<NotificationsSectionSkeleton />}>
            <NotificationsSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}

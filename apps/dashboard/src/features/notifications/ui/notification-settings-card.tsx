import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Collapsible,
   CollapsibleContent,
} from "@packages/ui/components/collapsible";
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
import { Switch } from "@packages/ui/components/switch";
import {
   AlertTriangle,
   Bell,
   BellOff,
   BellRing,
   CreditCard,
   Loader2,
   Receipt,
   Wallet,
} from "lucide-react";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationSettingsCard() {
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
         <Card>
            <CardHeader>
               <CardTitle>Notificações Push</CardTitle>
               <CardDescription>
                  Seu navegador não suporta notificações push.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   if (!isPushEnabled) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Notificações Push</CardTitle>
               <CardDescription>
                  Notificações push não estão configuradas no servidor.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   if (permission === "denied") {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Notificações Push</CardTitle>
               <CardDescription>
                  Você bloqueou as notificações. Para receber notificações,
                  permita nas configurações do seu navegador.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Notificações Push</CardTitle>
            <CardDescription>
               Receba notificações em tempo real sobre suas finanças.
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Collapsible open={isEnabled}>
               <Item>
                  <ItemMedia variant="icon">
                     {isEnabled ? (
                        <BellRing className="size-4" />
                     ) : (
                        <BellOff className="size-4" />
                     )}
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Ativar notificações</ItemTitle>
                     <ItemDescription>
                        {isEnabled
                           ? "Você receberá alertas sobre transações, orçamentos e lembretes."
                           : "Ative para receber alertas importantes no seu dispositivo."}
                     </ItemDescription>
                  </ItemContent>
                  {isLoading ? (
                     <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                     <Switch
                        aria-label="Ativar notificações push"
                        checked={isEnabled}
                        onCheckedChange={toggle}
                     />
                  )}
               </Item>

               <CollapsibleContent>
                  <ItemSeparator className="my-4" />

                  <ItemGroup>
                     <Item>
                        <ItemMedia variant="icon">
                           <Wallet className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>Alertas de orçamento</ItemTitle>
                           <ItemDescription>
                              Quando você atingir limites do orçamento
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Alertas de orçamento"
                              checked={preferences.budgetAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("budgetAlerts", v)
                              }
                           />
                        )}
                     </Item>

                     <ItemSeparator />

                     <Item>
                        <ItemMedia variant="icon">
                           <Receipt className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>Lembretes de contas</ItemTitle>
                           <ItemDescription>
                              Antes do vencimento de contas recorrentes
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Lembretes de contas"
                              checked={preferences.billReminders}
                              onCheckedChange={(v) =>
                                 updatePreference("billReminders", v)
                              }
                           />
                        )}
                     </Item>

                     <ItemSeparator />

                     <Item>
                        <ItemMedia variant="icon">
                           <AlertTriangle className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>Contas vencidas</ItemTitle>
                           <ItemDescription>
                              Quando houver contas em atraso
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Alertas de contas vencidas"
                              checked={preferences.overdueAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("overdueAlerts", v)
                              }
                           />
                        )}
                     </Item>

                     <ItemSeparator />

                     <Item>
                        <ItemMedia variant="icon">
                           <CreditCard className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>Novas transações</ItemTitle>
                           <ItemDescription>
                              Quando transações forem adicionadas
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Alertas de transações"
                              checked={preferences.transactionAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("transactionAlerts", v)
                              }
                           />
                        )}
                     </Item>
                  </ItemGroup>
               </CollapsibleContent>
            </Collapsible>
         </CardContent>
      </Card>
   );
}

export function NotificationPromptBanner({
   onDismiss,
}: {
   onDismiss?: () => void;
}) {
   const {
      isSupported,
      isEnabled,
      isPushEnabled,
      permission,
      isLoading,
      subscribe,
   } = usePushNotifications();

   if (!isSupported || !isPushEnabled || isEnabled || permission === "denied") {
      return null;
   }

   const handleEnable = async () => {
      await subscribe();
   };

   return (
      <Item className="rounded-lg border bg-card p-4" variant="outline">
         <ItemMedia className="bg-primary/10 text-primary" variant="icon">
            <Bell className="size-5" />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>Ative as notificações</ItemTitle>
            <ItemDescription>
               Receba alertas sobre suas finanças em tempo real.
            </ItemDescription>
         </ItemContent>
         <ItemActions>
            {onDismiss && (
               <Button onClick={onDismiss} size="sm" variant="ghost">
                  Agora não
               </Button>
            )}
            <Button disabled={isLoading} onClick={handleEnable} size="sm">
               {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
               ) : (
                  "Ativar"
               )}
            </Button>
         </ItemActions>
      </Item>
   );
}

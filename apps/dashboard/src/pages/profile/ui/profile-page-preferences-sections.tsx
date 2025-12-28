import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
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
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Globe, Moon } from "lucide-react";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { LanguageCommand } from "@/layout/language-command";
import { ThemeSwitcher } from "@/layout/theme-provider";

export function PreferencesSection() {
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   const updateConsentMutation = useMutation({
      mutationFn: async (consent: boolean) => {
         return betterAuthClient.updateUser({
            telemetryConsent: consent,
         });
      },
   });

   const hasConsent = session?.user?.telemetryConsent ?? true;

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.preferences.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.preferences.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex-1 overflow-y-auto">
            <ItemGroup>
               {/* Theme Toggle Group */}
               <Item>
                  <ItemMedia variant="icon">
                     <Moon className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.theme.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.theme.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <ThemeSwitcher />
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Language Selection */}
               <Item>
                  <ItemMedia variant="icon">
                     <Globe className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.language.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.language.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <LanguageCommand />
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Telemetry Consent */}
               <Item>
                  <ItemMedia variant="icon">
                     <Activity className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.telemetry.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.telemetry.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Switch
                        checked={hasConsent}
                        disabled={updateConsentMutation.isPending}
                        onCheckedChange={(checked) => {
                           updateConsentMutation.mutate(checked);
                        }}
                     />
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

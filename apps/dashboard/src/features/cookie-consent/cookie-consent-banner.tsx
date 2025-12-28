import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Card } from "@packages/ui/components/card";
import { useMutation } from "@tanstack/react-query";
import { Cookie, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";
import { useCookieConsent } from "./use-cookie-consent";

export function CookieConsentBanner() {
   const { consent, accept, decline, isHydrated } = useCookieConsent();

   const updateTelemetry = useMutation({
      mutationFn: async (telemetryConsent: boolean) => {
         return betterAuthClient.updateUser({ telemetryConsent });
      },
      onError: () => {
         toast.error(translate("common.errors.default"));
      },
   });

   if (!isHydrated || consent !== null) return null;

   const handleAccept = async () => {
      try {
         await updateTelemetry.mutateAsync(true);
         accept();
         toast.success(translate("common.cookies.banner.accepted"));
      } catch {
         // Error already handled by mutation onError
      }
   };

   const handleDecline = async () => {
      try {
         await updateTelemetry.mutateAsync(false);
         decline();
         toast.success(translate("common.cookies.banner.declined"));
      } catch {
         // Error already handled by mutation onError
      }
   };

   return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
         <Card className="p-4 shadow-lg border-2 dark:border-zinc-700">
            <div className="flex items-start gap-3">
               <Cookie className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
               <div className="space-y-3 flex-1 min-w-0">
                  <div className="space-y-1">
                     <h3 className="font-semibold text-sm">
                        {translate("common.cookies.banner.title")}
                     </h3>
                     <p className="text-xs text-muted-foreground">
                        {translate("common.cookies.banner.description")}
                     </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                     <Button
                        className="flex-1 min-w-fit"
                        disabled={updateTelemetry.isPending}
                        onClick={handleAccept}
                        size="sm"
                     >
                        {updateTelemetry.isPending && (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        {translate("common.cookies.banner.accept")}
                     </Button>
                     <Button
                        className="flex-1 min-w-fit"
                        disabled={updateTelemetry.isPending}
                        onClick={handleDecline}
                        size="sm"
                        variant="outline"
                     >
                        {updateTelemetry.isPending && (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        {translate("common.cookies.banner.decline")}
                     </Button>
                  </div>
                  <a
                     className="text-xs text-muted-foreground hover:underline inline-block"
                     href="https://montte.co/privacy-policy"
                     rel="noopener noreferrer"
                     target="_blank"
                  >
                     {translate("common.cookies.banner.privacy-policy")}
                  </a>
               </div>
            </div>
         </Card>
      </div>
   );
}

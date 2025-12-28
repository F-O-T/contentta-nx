import { translate } from "@packages/localization";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { ShieldCheck } from "lucide-react";

export function StripeDataDisclosure() {
   return (
      <Alert className="bg-muted/50 border-primary/20">
         <ShieldCheck className="size-4 text-primary" />
         <AlertTitle>{translate("common.stripe.disclosure.title")}</AlertTitle>
         <AlertDescription className="space-y-2 mt-2">
            <p className="text-sm">
               {translate("common.stripe.disclosure.description")}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
               <p>• {translate("common.stripe.disclosure.pci-dss")}</p>
               <p>• {translate("common.stripe.disclosure.no-card-storage")}</p>
               <p>• {translate("common.stripe.disclosure.encrypted")}</p>
               <p>
                  {translate("common.stripe.disclosure.privacy-policy-prefix")}{" "}
                  <a
                     className="underline hover:text-foreground transition-colors"
                     href="https://stripe.com/privacy"
                     rel="noopener noreferrer"
                     target="_blank"
                  >
                     {translate("common.stripe.disclosure.privacy-policy-link")}
                  </a>
               </p>
            </div>
         </AlertDescription>
      </Alert>
   );
}

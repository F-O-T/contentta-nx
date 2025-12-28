import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { FieldDescription } from "@packages/ui/components/field";
import { Spinner } from "@packages/ui/components/spinner";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, Sparkles, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

export function AnonymousPage() {
   const router = useRouter();
   const [isLoading, setIsLoading] = useState(false);

   const handleAnonymousSignIn = useCallback(async () => {
      setIsLoading(true);
      await betterAuthClient.signIn.anonymous(
         {},
         {
            onError: ({ error }) => {
               setIsLoading(false);
               toast.error(error.message);
            },
            onSuccess: () => {
               toast.success(
                  translate("dashboard.routes.anonymous.messages.success"),
               );
               router.navigate({ params: { slug: "" }, to: "/$slug/home" });
            },
         },
      );
   }, [router]);

   return (
      <section className="space-y-6 w-full">
         {/* Back Link */}
         <Button asChild className="gap-2 px-0" variant="link">
            <Link to="/auth/sign-in">
               <ArrowLeft className="size-4" />
               {translate("dashboard.routes.anonymous.actions.back-to-sign-in")}
            </Link>
         </Button>

         {/* Header */}
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               {translate("dashboard.routes.anonymous.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
               {translate("dashboard.routes.anonymous.description")}
            </p>
         </div>

         {/* Benefits */}
         <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
               <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 shrink-0">
                     <Check className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm">
                     {translate("dashboard.routes.anonymous.benefits.no-email")}
                  </p>
               </div>
               <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 shrink-0">
                     <Zap className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm">
                     {translate("dashboard.routes.anonymous.benefits.instant")}
                  </p>
               </div>
               <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 shrink-0">
                     <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm">
                     {translate(
                        "dashboard.routes.anonymous.benefits.convert-later",
                     )}
                  </p>
               </div>
            </div>

            {/* CTA Button */}
            <Button
               className="w-full h-11"
               disabled={isLoading}
               onClick={handleAnonymousSignIn}
            >
               {isLoading ? (
                  <Spinner />
               ) : (
                  translate("dashboard.routes.anonymous.actions.sign-in")
               )}
            </Button>

            {/* Note */}
            <FieldDescription className="text-center">
               {translate("dashboard.routes.anonymous.note")}
            </FieldDescription>
         </div>

         {/* Footer */}
         <div className="text-sm text-center">
            <div className="flex gap-1 justify-center items-center">
               <span>
                  {translate("dashboard.routes.sign-in.texts.no-account")}
               </span>
               <Link
                  className="text-primary font-medium hover:underline"
                  to="/auth/sign-up"
               >
                  {translate("dashboard.routes.sign-in.actions.sign-up")}
               </Link>
            </div>
         </div>
      </section>
   );
}

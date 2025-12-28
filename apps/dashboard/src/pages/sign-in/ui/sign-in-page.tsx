import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { FieldDescription } from "@packages/ui/components/field";
import { Spinner } from "@packages/ui/components/spinner";
import { Link } from "@tanstack/react-router";
import { KeyRound, Sparkles, User } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface SignInPageProps {
   redirectUrl?: string;
}

export function SignInPage({ redirectUrl }: SignInPageProps) {
   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
   const lastMethod = betterAuthClient.getLastUsedLoginMethod();

   // Determine callback URL - use redirect if provided, otherwise default
   const callbackURL = redirectUrl
      ? `${window.location.origin}${redirectUrl}`
      : `${window.location.origin}/auth/sign-in`;

   const handleGoogleSignIn = useCallback(async () => {
      await betterAuthClient.signIn.social(
         {
            callbackURL,
            provider: "google",
         },
         {
            onError: ({ error }) => {
               setIsGoogleLoading(false);
               toast.error(error.message);
            },
            onRequest: () => {
               setIsGoogleLoading(true);
               toast.loading(
                  translate(
                     "dashboard.routes.sign-in.messages.google-requesting",
                  ),
               );
            },
         },
      );
   }, [callbackURL]);

   const TermsAndPrivacyText = () => {
      const text = translate(
         "dashboard.routes.sign-in.texts.terms-and-privacy",
      ).split("{split}");

      return (
         <>
            <span>{text[0]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://montte.co/terms-of-service"
               rel="noopener noreferrer"
               target="_blank"
            >
               {translate("dashboard.routes.sign-in.texts.terms-of-service")}
            </a>
            <span>{text[1]}</span>
            <a
               className="underline text-muted-foreground hover:text-primary"
               href="https://montte.co/privacy-policy"
               rel="noopener noreferrer"
               target="_blank"
            >
               {translate("dashboard.routes.sign-in.texts.privacy-policy")}
            </a>
            <span>{text[2]}</span>
         </>
      );
   };

   return (
      <section className="space-y-8 w-full">
         {/* Header */}
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               {translate("dashboard.routes.sign-in.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
               {translate("dashboard.routes.sign-in.description")}
            </p>
         </div>

         {/* Primary Actions */}
         <div className="space-y-3">
            {/* Google SSO - Primary */}
            <Button
               className="w-full h-12 text-base relative"
               disabled={isGoogleLoading}
               onClick={handleGoogleSignIn}
               variant="outline"
            >
               {isGoogleLoading ? (
                  <Spinner />
               ) : (
                  <svg
                     className="size-5"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                     <title>Google</title>
                     <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                     />
                  </svg>
               )}
               <span>
                  {translate("dashboard.routes.sign-in.actions.google-sign-in")}
               </span>
               {lastMethod === "google" && (
                  <Badge className="absolute -top-2 -right-2" variant="default">
                     {translate("dashboard.routes.sign-in.last-used")}
                  </Badge>
               )}
            </Button>

            {/* Try without account - Prominent */}
            <Button
               asChild
               className="w-full h-12 text-base relative"
               variant="secondary"
            >
               <Link to="/auth/anonymous">
                  <User className="size-5" />
                  <span>
                     {translate(
                        "dashboard.routes.sign-in.actions.try-without-account",
                     )}
                  </span>
                  {lastMethod === "anonymous" && (
                     <Badge
                        className="absolute -top-2 -right-2"
                        variant="default"
                     >
                        {translate("dashboard.routes.sign-in.last-used")}
                     </Badge>
                  )}
               </Link>
            </Button>
         </div>

         {/* Divider */}
         <div className="relative">
            <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-background px-2 text-muted-foreground">
                  {translate("dashboard.routes.sign-in.texts.or-continue-with")}
               </span>
            </div>
         </div>

         {/* Method Selector Cards */}
         <div className="grid grid-cols-2 gap-3">
            {/* Email & Password Card */}
            <Link
               className="group relative flex flex-col items-center gap-3 p-4 rounded-lg border border-border bg-background hover:border-primary hover:bg-accent/50 transition-all duration-200"
               to="/auth/sign-in/email"
            >
               {lastMethod === "email" && (
                  <Badge className="absolute -top-2 -right-2" variant="default">
                     {translate("dashboard.routes.sign-in.last-used")}
                  </Badge>
               )}
               <div className="flex items-center justify-center size-10 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <KeyRound className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
               </div>
               <div className="text-center">
                  <p className="text-sm font-medium">
                     {translate("dashboard.routes.sign-in.methods.email")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.sign-in.methods.email-description",
                     )}
                  </p>
               </div>
            </Link>

            {/* Magic Link Card */}
            <Link
               className="group relative flex flex-col items-center gap-3 p-4 rounded-lg border border-border bg-background hover:border-primary hover:bg-accent/50 transition-all duration-200"
               to="/auth/magic-link"
            >
               {lastMethod === "magicLink" && (
                  <Badge className="absolute -top-2 -right-2" variant="default">
                     {translate("dashboard.routes.sign-in.last-used")}
                  </Badge>
               )}
               <div className="flex items-center justify-center size-10 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <Sparkles className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
               </div>
               <div className="text-center">
                  <p className="text-sm font-medium">
                     {translate("dashboard.routes.sign-in.methods.magic-link")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.sign-in.methods.magic-link-description",
                     )}
                  </p>
               </div>
            </Link>
         </div>

         {/* Footer */}
         <div className="text-sm text-center space-y-4">
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
            <FieldDescription className="text-center">
               <TermsAndPrivacyText />
            </FieldDescription>
         </div>
      </section>
   );
}

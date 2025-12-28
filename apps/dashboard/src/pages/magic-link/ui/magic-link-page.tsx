import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";

export function MagicLinkPage() {
   const [isSent, setIsSent] = useState(false);

   const schema = z.object({
      email: z.email(translate("common.validation.email")),
   });

   const handleMagicLinkSignIn = useCallback(async (email: string) => {
      await betterAuthClient.signIn.magicLink(
         {
            email,
            callbackURL: `${window.location.origin}/auth/sign-in`,
         },
         {
            onError: ({ error }) => {
               toast.error(error.message);
            },
            onRequest: () => {
               toast.loading(
                  translate("dashboard.routes.magic-link.messages.sending"),
               );
            },
            onSuccess: () => {
               setIsSent(true);
               toast.success(
                  translate("dashboard.routes.magic-link.messages.sent"),
               );
            },
         },
      );
   }, []);

   const form = useForm({
      defaultValues: {
         email: "",
      },
      onSubmit: async ({ value }) => {
         await handleMagicLinkSignIn(value.email);
      },
      validators: {
         onBlur: schema,
      },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   if (isSent) {
      return (
         <section className="space-y-6 w-full">
            <div className="text-center space-y-6 py-4">
               {/* Success Icon */}
               <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center size-16 rounded-full bg-primary/10">
                     <Mail className="size-8 text-primary" />
                  </div>
               </div>

               {/* Header */}
               <div className="space-y-2">
                  <h1 className="text-3xl font-semibold font-serif">
                     {translate("dashboard.routes.magic-link.sent-title")}
                  </h1>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                     {translate("dashboard.routes.magic-link.sent-description")}
                  </p>
               </div>

               {/* Actions */}
               <div className="flex flex-col gap-3 pt-2">
                  <Button
                     className="h-11"
                     onClick={() => setIsSent(false)}
                     variant="outline"
                  >
                     {translate(
                        "dashboard.routes.magic-link.actions.try-different-email",
                     )}
                  </Button>
                  <Button asChild variant="ghost">
                     <Link to="/auth/sign-in">
                        <ArrowLeft className="size-4" />
                        {translate(
                           "dashboard.routes.magic-link.actions.back-to-sign-in",
                        )}
                     </Link>
                  </Button>
               </div>
            </div>
         </section>
      );
   }

   return (
      <section className="space-y-6 w-full">
         {/* Back Link */}
         <Button asChild className="gap-2 px-0" variant="link">
            <Link to="/auth/sign-in">
               <ArrowLeft className="size-4" />
               {translate(
                  "dashboard.routes.magic-link.actions.back-to-sign-in",
               )}
            </Link>
         </Button>

         {/* Header */}
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               {translate("dashboard.routes.magic-link.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
               {translate("dashboard.routes.magic-link.description")}
            </p>
         </div>

         {/* Form */}
         <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
               <form.Field name="email">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("common.form.email.label")}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.email.placeholder",
                              )}
                              type="email"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     className="w-full h-11"
                     disabled={!formState.canSubmit || formState.isSubmitting}
                     type="submit"
                  >
                     {formState.isSubmitting ? (
                        <Spinner />
                     ) : (
                        translate(
                           "dashboard.routes.magic-link.actions.send-link",
                        )
                     )}
                  </Button>
               )}
            </form.Subscribe>
         </form>

         {/* Note */}
         <FieldDescription className="text-center">
            {translate("dashboard.routes.magic-link.note")}
         </FieldDescription>

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

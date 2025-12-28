import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { PasswordInput } from "@packages/ui/components/password-input";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";

export function SignInEmailPage() {
   const schema = z.object({
      email: z.email(translate("common.validation.email")),
      password: z
         .string()
         .min(
            8,
            translate("common.validation.min-length").replace("{min}", "8"),
         ),
   });
   const router = useRouter();

   const handleSignIn = useCallback(
      async (email: string, password: string) => {
         await betterAuthClient.signIn.email(
            {
               email,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(error.message);
               },
               onRequest: () => {
                  toast.loading(
                     translate("dashboard.routes.sign-in.messages.requesting"),
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate("dashboard.routes.sign-in.messages.success"),
                  );
                  router.navigate({ params: { slug: "" }, to: "/$slug/home" });
               },
            },
         );
      },
      [router],
   );

   const form = useForm({
      defaultValues: {
         email: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         const { email, password } = value;
         await handleSignIn(email, password);
         formApi.reset();
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

   return (
      <section className="space-y-6 w-full">
         {/* Back Link */}
         <Button asChild className="gap-2 px-0" variant="link">
            <Link to="/auth/sign-in">
               <ArrowLeft className="size-4" />
               {translate("dashboard.routes.sign-in.actions.back-to-options")}
            </Link>
         </Button>

         {/* Header */}
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               {translate("dashboard.routes.sign-in.email.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
               {translate("dashboard.routes.sign-in.email.description")}
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
            <FieldGroup>
               <form.Field name="password">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field aria-required data-invalid={isInvalid}>
                           <div className="flex justify-between items-center">
                              <FieldLabel htmlFor={field.name}>
                                 {translate("common.form.password.label")}
                              </FieldLabel>
                              <Link
                                 className="underline text-sm text-muted-foreground hover:text-primary"
                                 to="/auth/forgot-password"
                              >
                                 {translate(
                                    "dashboard.routes.sign-in.actions.forgot-password",
                                 )}
                              </Link>
                           </div>
                           <PasswordInput
                              autoComplete="current-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.form.password.placeholder",
                              )}
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
                     {translate("dashboard.routes.sign-in.actions.sign-in")}
                  </Button>
               )}
            </form.Subscribe>
         </form>

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

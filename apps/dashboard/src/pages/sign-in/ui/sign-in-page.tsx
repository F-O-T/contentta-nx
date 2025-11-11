import brandConfig from "@packages/brand/index.json";
import { translate } from "@packages/localization";

import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { PasswordInput } from "@packages/ui/components/password-input";
import { Separator } from "@packages/ui/components/separator";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";

type codes = "INVALID_EMAIL_OR_PASSWORD" | "default";
export function SignInPage() {
   const schema = z.object({
      email: z.email(translate("pages.sign-in.validation.email-invalid")),
      password: z
         .string()
         .min(8, translate("pages.sign-in.validation.password-min-length")),
   });
   const router = useRouter();
   const getErrorMessage = useMemo(
      () => ({
         default: translate("pages.sign-in.errors.unknown"),
         INVALID_EMAIL_OR_PASSWORD: translate(
            "pages.sign-in.errors.invalid-credentials",
         ),
      }),
      [],
   );
   const handleGoogleSignIn = useCallback(async () => {
      await betterAuthClient.signIn.social(
         {
            callbackURL: `${window.location.origin}/home`,
            provider: "google",
         },
         {
            onError: ({ error }) => {
               toast.error(
                  getErrorMessage[error.code as codes] ||
                     translate("pages.sign-in.errors.unknown"),
                  {
                     id: "sign-in-toast",
                  },
               );
            },
            onRequest: () => {
               toast.loading(translate("pages.sign-in.messages.loading"), {
                  id: "sign-in-toast",
               });
            },
         },
      );
   }, [getErrorMessage]);
   const handleSignIn = useCallback(
      async ({ email, password }: z.infer<typeof schema>) => {
         await betterAuthClient.signIn.email(
            {
               email,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(
                     getErrorMessage[error.code as codes] ||
                        translate("pages.sign-in.errors.unknown"),
                     {
                        id: "sign-in-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(translate("pages.sign-in.messages.loading"), {
                     id: "sign-in-toast",
                  });
               },
               onSuccess: ({ data }) => {
                  toast.success(translate("pages.sign-in.messages.success"), {
                     description: translate("pages.sign-in.messages.welcome", {
                        brand: brandConfig.name,
                        name: data.user.name,
                     }),
                     id: "sign-in-toast",
                  });
                  router.navigate({
                     to: "/home",
                  });
               },
            },
         );
      },
      [getErrorMessage, router],
   );

   const form = useForm({
      defaultValues: {
         email: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleSignIn(value);
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
      <section className="space-y-4">
         <Card>
            <CardHeader className="text-center">
               <CardTitle className="text-3xl">
                  {translate("pages.sign-in.title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.sign-in.description")}
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Button
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  variant="outline"
               >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <title>Google</title>
                     <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                     />
                  </svg>
                  <span>{translate("pages.sign-in.google-button")}</span>
               </Button>
               <Separator />
               <form className="space-y-4 " onSubmit={(e) => handleSubmit(e)}>
                  <FieldGroup>
                     <form.Field name="email">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate(
                                       "pages.sign-in.form.email.label",
                                    )}
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
                                       "pages.sign-in.form.email.placeholder",
                                    )}
                                    type="email"
                                    value={field.state.value}
                                 />

                                 {isInvalid && (
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
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
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <div className="flex justify-between items-center">
                                    <FieldLabel htmlFor={field.name}>
                                       {translate(
                                          "pages.sign-in.form.password.label",
                                       )}
                                    </FieldLabel>
                                    <Link
                                       className="underline text-sm  text-muted-foreground"
                                       to="/auth/forgot-password"
                                    >
                                       {translate(
                                          "pages.sign-in.footer.forgot-password",
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
                                       "pages.sign-in.form.password.placeholder",
                                    )}
                                    value={field.state.value}
                                 />
                                 {isInvalid && (
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
                                 )}
                              </Field>
                           );
                        }}
                     </form.Field>
                  </FieldGroup>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           className=" w-full flex gap-2 items-center justify-center"
                           disabled={
                              !formState.canSubmit || formState.isSubmitting
                           }
                           type="submit"
                        >
                           {translate("pages.sign-in.form.submit")}
                           <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                     )}
                  </form.Subscribe>
               </form>
            </CardContent>
            <CardFooter className="text-sm space-y-2 flex flex-col justify-center items-center">
               <div className="w-full  flex gap-1 justify-center items-center">
                  <span>{translate("pages.sign-in.footer.no-account")}</span>
                  <Link
                     className="underline text-muted-foreground"
                     to="/auth/sign-up"
                  >
                     {translate("pages.sign-in.footer.sign-up-link")}
                  </Link>
               </div>
            </CardFooter>
         </Card>
         <FieldDescription className="text-center">
            <span>By clicking continue, you agree to our</span>
            &nbsp;
            <a href="https://contentagen.com/terms-of-service">
               Terms of Service
            </a>
            &nbsp;
            <span>and</span>
            &nbsp;
            <a href="https://contentagen.com/privacy-policy">Privacy Policy</a>.
         </FieldDescription>
      </section>
   );
}

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
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSeparator,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";

const steps = [
   { id: "enter-email", title: "enter-email" },
   { id: "enter-otp", title: "enter-otp" },
   { id: "enter-password", title: "enter-password" },
] as const;

const { Stepper } = defineStepper(...steps);

export function ForgotPasswordPage() {
   const router = useRouter();
   const [sendingOtp, setSendingOtp] = useState(false);
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z.email(
            translate("pages.forgot-password.validation.email-invalid"),
         ),
         otp: z
            .string()
            .min(6, translate("pages.forgot-password.validation.otp-length")),
         password: z
            .string()
            .min(
               8,
               translate(
                  "pages.forgot-password.validation.password-min-length",
               ),
            ),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: translate(
            "pages.forgot-password.validation.passwords-no-match",
         ),
         path: ["confirmPassword"],
      });

   const handleResetPassword = useCallback(
      async ({
         email,
         otp,
         password,
      }: {
         email: string;
         otp: string;
         password: string;
      }) => {
         await betterAuthClient.emailOtp.resetPassword(
            {
               email,
               otp,
               password,
            },
            {
               onError: () => {
                  toast.error(
                     translate("pages.forgot-password.messages.reset-error"),
                     {
                        id: "forgot-password-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(
                     translate("pages.forgot-password.messages.reset-loading"),
                     {
                        id: "forgot-password-toast",
                     },
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate("pages.forgot-password.messages.reset-success"),
                     {
                        id: "forgot-password-toast",
                     },
                  );
                  router.navigate({
                     to: "/auth/sign-in",
                  });
               },
            },
         );
      },
      [router],
   );
   const form = useForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         otp: "",
         password: "",
      },
      onSubmit: async ({ value }) => {
         await handleResetPassword(value);
      },
      validators: {
         onBlur: schema,
      },
   });

   const sendOtp = useCallback(async (email: string) => {
      await betterAuthClient.emailOtp.sendVerificationOtp(
         {
            email,
            type: "forget-password",
         },

         {
            onError: () => {
               setSendingOtp(false);
               toast.error(
                  translate("pages.forgot-password.messages.send-error"),
                  {
                     id: "send-otp-toast",
                  },
               );
            },
            onRequest: () => {
               setSendingOtp(true);
               toast.loading(
                  translate("pages.forgot-password.messages.send-loading"),
                  {
                     id: "send-otp-toast",
                  },
               );
            },
            onSuccess: () => {
               setSendingOtp(false);
               toast.success(
                  translate("pages.forgot-password.messages.send-success"),
                  {
                     id: "send-otp-toast",
                  },
               );
            },
         },
      );
   }, []);
   const handleSubmit = useCallback(
      (e: React.FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   function EmailStep() {
      return (
         <FieldGroup>
            <form.Field name="email">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           {translate("pages.forgot-password.form.email.label")}
                        </FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           autoComplete="email"
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder={translate(
                              "pages.forgot-password.form.email.placeholder",
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
      );
   }

   function OtpStep() {
      return (
         <FieldGroup>
            <form.Field name="otp">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           {translate("pages.forgot-password.form.otp.label")}
                        </FieldLabel>
                        <InputOTP
                           aria-invalid={isInvalid}
                           autoComplete="one-time-code"
                           id={field.name}
                           maxLength={6}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={field.handleChange}
                           value={field.state.value}
                        >
                           <div className="w-full flex justify-center items-center gap-2">
                              <InputOTPGroup>
                                 <InputOTPSlot index={0} />
                                 <InputOTPSlot index={1} />
                              </InputOTPGroup>
                              <InputOTPSeparator />
                              <InputOTPGroup>
                                 <InputOTPSlot index={2} />
                                 <InputOTPSlot index={3} />
                              </InputOTPGroup>
                              <InputOTPSeparator />
                              <InputOTPGroup>
                                 <InputOTPSlot index={4} />
                                 <InputOTPSlot index={5} />
                              </InputOTPGroup>
                           </div>
                        </InputOTP>
                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>
         </FieldGroup>
      );
   }

   function PasswordStep() {
      return (
         <>
            <FieldGroup>
               <form.Field name="password">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "pages.forgot-password.labels.new-password",
                              )}
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              autoComplete="new-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.forgot-password.placeholders.enter-new-password",
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
            <FieldGroup>
               <form.Field name="confirmPassword">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate(
                                 "pages.forgot-password.labels.confirm-new-password",
                              )}
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              autoComplete="new-password"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.forgot-password.placeholders.confirm-new-password",
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
         </>
      );
   }
   return (
      <Stepper.Provider>
         {({ methods }) => (
            <Card>
               <CardHeader className="text-center">
                  <CardTitle className="text-3xl ">
                     {translate("pages.forgot-password.title")}
                  </CardTitle>
                  <CardDescription className="">
                     {methods.current.id === "enter-email"
                        ? translate(
                             "pages.forgot-password.descriptions.enter-email",
                          )
                        : methods.current.id === "enter-otp"
                          ? translate(
                               "pages.forgot-password.descriptions.enter-otp",
                            )
                          : translate(
                               "pages.forgot-password.descriptions.enter-password",
                            )}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id} />
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "enter-email": () => <EmailStep />,
                        "enter-otp": () => <OtpStep />,
                        "enter-password": () => <PasswordStep />,
                     })}
                     <Stepper.Controls className="flex w-full justify-between">
                        <Button
                           disabled={methods.isFirst}
                           onClick={methods.prev}
                           type="button"
                           variant="outline"
                        >
                           {translate("pages.forgot-password.actions.previous")}
                        </Button>
                        {methods.isLast ? (
                           <form.Subscribe>
                              {(formState) => (
                                 <Button
                                    className="shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {translate(
                                       "pages.forgot-password.actions.reset-password",
                                    )}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : methods.current.id === "enter-email" ? (
                           <form.Subscribe
                              selector={(state) => ({
                                 emailValid: state.fieldMeta.email?.isValid,
                                 emailValue: state.values.email,
                              })}
                           >
                              {({ emailValid, emailValue }) => (
                                 <Button
                                    disabled={!emailValid || sendingOtp}
                                    onClick={async () => {
                                       await sendOtp(emailValue);
                                       methods.next();
                                    }}
                                    type="button"
                                 >
                                    {translate(
                                       "pages.forgot-password.actions.next",
                                    )}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <Button onClick={methods.next} type="button">
                              {translate("pages.forgot-password.actions.next")}
                           </Button>
                        )}
                     </Stepper.Controls>
                  </form>
               </CardContent>
               <CardFooter className="text-sm flex gap-1 items-center justify-center">
                  <span>
                     {translate(
                        "pages.forgot-password.actions.remembered-password",
                     )}
                  </span>
                  <Link
                     className=" underline text-muted-foreground"
                     to="/auth/sign-in"
                  >
                     {translate("pages.forgot-password.actions.sign-in")}
                  </Link>
               </CardFooter>
            </Card>
         )}
      </Stepper.Provider>
   );
}

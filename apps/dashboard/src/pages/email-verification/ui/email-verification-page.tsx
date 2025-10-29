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
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSeparator,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { useForm } from "@tanstack/react-form";
import { useRouter, useSearch } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";

type codes = "INVALID_OTP" | "default";

export function EmailVerificationPage() {
   const email = useSearch({
      from: "/auth/email-verification",
      select: (s) => s.email,
   });
   const schema = z.object({
      otp: z
         .string()
         .min(6, translate("pages.email-verification.validation.otp-length"))
         .max(6),
   });

   const getErrorMessage = useMemo(
      () => ({
         default: translate("pages.email-verification.messages.unknown-error"),
         INVALID_OTP: translate(
            "pages.email-verification.messages.invalid-otp",
         ),
      }),
      [],
   );
   const router = useRouter();
   const handleResendEmail = useCallback(async () => {
      await betterAuthClient.emailOtp.sendVerificationOtp(
         {
            email,

            type: "email-verification",
         },
         {
            onError: ({ error }) => {
               toast.error(
                  getErrorMessage[error.code as codes] ||
                     translate(
                        "pages.email-verification.messages.verification-error",
                     ),
                  {
                     id: "verification-code-toast",
                  },
               );
            },
            onRequest: () => {
               toast.loading(
                  translate("pages.email-verification.messages.loading-send"),
                  {
                     id: "verification-code-toast",
                  },
               );
            },
            onSuccess: () => {
               toast.success(
                  translate("pages.email-verification.messages.success-send"),
                  {
                     description: translate(
                        "pages.email-verification.messages.success-send-description",
                     ),
                     id: "verification-code-toast",
                  },
               );
            },
         },
      );
   }, [email, getErrorMessage]);
   const handleVerifyEmail = useCallback(
      async (value: z.infer<typeof schema>) => {
         await betterAuthClient.emailOtp.verifyEmail(
            {
               email,
               otp: value.otp,
            },
            {
               onError: ({ error }) => {
                  toast.error(
                     getErrorMessage[error.code as codes] ||
                        translate(
                           "pages.email-verification.messages.unknown-error",
                        ),
                     {
                        id: "email-verification-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(
                     translate(
                        "pages.email-verification.messages.loading-verify",
                     ),
                     {
                        id: "email-verification-toast",
                     },
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate(
                        "pages.email-verification.messages.success-verify",
                     ),
                     {
                        description: translate(
                           "pages.email-verification.messages.success-verify-description",
                        ),
                        id: "email-verification-toast",
                     },
                  );
                  router.navigate({
                     to: "/home",
                  });
               },
            },
         );
      },
      [email, router, getErrorMessage],
   );
   const form = useForm({
      defaultValues: {
         otp: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleVerifyEmail(value);
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
      <Card>
         <CardHeader className="text-center">
            <CardTitle className="text-3xl ">
               {translate("pages.email-verification.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.email-verification.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <form
               className="space-y-4"
               onSubmit={(e) => {
                  handleSubmit(e);
               }}
            >
               <FieldGroup>
                  <form.Field name="otp">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field
                              className="flex flex-col items-center"
                              data-invalid={isInvalid}
                           >
                              <FieldLabel>
                                 {translate(
                                    "pages.email-verification.form.verification-code.label",
                                 )}
                              </FieldLabel>
                              <InputOTP
                                 aria-invalid={isInvalid}
                                 autoComplete="one-time-code"
                                 className="gap-2"
                                 maxLength={6}
                                 onBlur={field.handleBlur}
                                 onChange={field.handleChange}
                                 value={field.state.value}
                              >
                                 <div className="w-full flex gap-2 items-center justify-center">
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
               <form.Subscribe>
                  {(formState) => (
                     <Button
                        className="w-full flex gap-2 items-center justify-center"
                        disabled={
                           !formState.canSubmit || formState.isSubmitting
                        }
                        type="submit"
                     >
                        {translate("pages.email-verification.form.submit")}
                        <ArrowRight className="w-4 h-4 " />
                     </Button>
                  )}
               </form.Subscribe>
            </form>
         </CardContent>
         <CardFooter>
            <Button
               className="w-full text-muted-foreground flex gap-2 items-center justify-center"
               onClick={handleResendEmail}
               variant="link"
            >
               {translate("pages.email-verification.form.resend")}
            </Button>
         </CardFooter>
      </Card>
   );
}

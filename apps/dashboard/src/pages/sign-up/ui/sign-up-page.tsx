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
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";

type codes = "USER_ALREADY_EXISTS" | "default";

const steps = [
   { id: "basic-info", title: "basic-info" },
   { id: "password", title: "password" },
] as const;

const { Stepper } = defineStepper(...steps);

// Internal component for basic info step

export function SignUpPage() {
   const router = useRouter();
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z.email(translate("pages.sign-up.validation.email-invalid")),
         name: z
            .string()
            .min(2, translate("pages.sign-up.validation.name-min-length")),
         password: z
            .string()
            .min(8, translate("pages.sign-up.validation.password-min-length")),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: translate("pages.sign-up.validation.passwords-no-match"),
         path: ["confirmPassword"],
      });

   const getErrorMessage = useMemo(
      () => ({
         default: translate("pages.sign-up.errors.unknown"),
         USER_ALREADY_EXISTS: translate("pages.sign-up.errors.user-exists"),
      }),
      [],
   );

   const handleSignUp = useCallback(
      async ({ name, email, password }: z.infer<typeof schema>) => {
         await betterAuthClient.signUp.email(
            {
               email,
               name,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(
                     getErrorMessage[error.code as codes] ||
                        translate("pages.sign-up.errors.unknown"),
                     {
                        id: "sign-up-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(translate("pages.sign-up.messages.loading"), {
                     id: "sign-up-toast",
                  });
               },
               onSuccess: ({ data }) => {
                  toast.success(translate("pages.sign-up.messages.success"), {
                     description: translate("pages.sign-up.messages.welcome", {
                        name: data.user.name,
                     }),
                     id: "sign-up-toast",
                  });
                  router.navigate({
                     search: { email: data.user.email },
                     to: "/auth/email-verification",
                  });
               },
            },
         );
      },
      [getErrorMessage, router],
   );

   const form = useForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         name: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleSignUp(value);
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

   function BasicInfoStep() {
      return (
         <>
            <FieldGroup>
               <form.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("pages.sign-up.form.name.label")}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="name"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.sign-up.form.name.placeholder",
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
               <form.Field name="email">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              {translate("pages.sign-up.form.email.label")}
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="email"
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.sign-up.form.email.placeholder",
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
         </>
      );
   }

   // Internal component for password step
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
                              {translate("pages.sign-up.form.password.label")}
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
                                 "pages.sign-up.form.password.placeholder",
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
                                 "pages.sign-up.form.confirm-password.label",
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
                                 "pages.sign-up.form.confirm-password.placeholder",
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
                  <CardTitle className="text-3xl  ">
                     {translate("pages.sign-up.title")}
                  </CardTitle>
                  <CardDescription>
                     {translate("pages.sign-up.description")}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id}></Stepper.Step>
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "basic-info": () => <BasicInfoStep />,
                        password: () => <PasswordStep />,
                     })}
                     <Stepper.Controls className="flex w-full justify-between">
                        <Button
                           disabled={methods.isFirst}
                           onClick={methods.prev}
                           type="button"
                           variant="outline"
                        >
                           {translate("pages.sign-up.form.previous")}
                        </Button>
                        {methods.isLast ? (
                           <form.Subscribe>
                              {(formState) => (
                                 <Button
                                    className=" flex gap-2 items-center justify-center"
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting
                                    }
                                    type="submit"
                                    variant="default"
                                 >
                                    {translate("pages.sign-up.form.submit")}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <form.Subscribe
                              selector={(state) => ({
                                 emailValid: state.fieldMeta.email?.isValid,
                                 nameValid: state.fieldMeta.name?.isValid,
                              })}
                           >
                              {({ nameValid, emailValid }) => (
                                 <Button
                                    disabled={!nameValid || !emailValid}
                                    onClick={methods.next}
                                    type="button"
                                 >
                                    {translate("pages.sign-up.form.next")}
                                 </Button>
                              )}
                           </form.Subscribe>
                        )}
                     </Stepper.Controls>
                  </form>
               </CardContent>
               <CardFooter className=" text-sm flex gap-1 items-center justify-center">
                  <span>{translate("pages.sign-up.footer.have-account")}</span>
                  <Link
                     className="underline text-muted-foreground"
                     to="/auth/sign-in"
                  >
                     {translate("pages.sign-up.footer.sign-in-link")}
                  </Link>
               </CardFooter>
            </Card>
         )}
      </Stepper.Provider>
   );
}

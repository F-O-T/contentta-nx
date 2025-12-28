/**
 * Encryption Setup Credenza
 *
 * Multi-step wizard for setting up E2E encryption.
 */

import { translate } from "@packages/localization";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { useForm } from "@tanstack/react-form";
import {
   AlertTriangle,
   CheckCircle2,
   Loader2,
   Lock,
   Shield,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCredenza } from "@/hooks/use-credenza";

type Step = "intro" | "passphrase" | "confirm" | "success";

interface EncryptionSetupCredenzaProps {
   enableE2E: (passphrase: string) => Promise<boolean>;
}

export function EncryptionSetupCredenza({
   enableE2E,
}: EncryptionSetupCredenzaProps) {
   const { closeCredenza } = useCredenza();
   const [step, setStep] = useState<Step>("intro");
   const [isSubmitting, setIsSubmitting] = useState(false);

   const schema = z
      .object({
         passphrase: z
            .string()
            .min(
               8,
               translate(
                  "dashboard.routes.settings.encryption.errors.passphrase-too-short",
               ),
            ),
         confirmPassphrase: z.string(),
      })
      .refine((data) => data.passphrase === data.confirmPassphrase, {
         message: translate(
            "dashboard.routes.settings.encryption.errors.passphrase-mismatch",
         ),
         path: ["confirmPassphrase"],
      });

   const form = useForm({
      defaultValues: {
         passphrase: "",
         confirmPassphrase: "",
      },
      validators: {
         onBlur: schema,
      },
      onSubmit: async ({ value }) => {
         setIsSubmitting(true);
         try {
            const success = await enableE2E(value.passphrase);
            if (success) {
               setStep("success");
            } else {
               toast.error(
                  translate(
                     "dashboard.routes.settings.encryption.errors.setup-failed",
                  ),
               );
            }
         } catch (_error) {
            toast.error(
               translate(
                  "dashboard.routes.settings.encryption.errors.setup-failed",
               ),
            );
         } finally {
            setIsSubmitting(false);
         }
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   const handleContinueToConfirm = async () => {
      await form.validate("change");
      if (form.state.canSubmit) {
         setStep("confirm");
      }
   };

   if (step === "intro") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle className="flex items-center gap-2">
                  <Shield className="size-5" />
                  {translate(
                     "dashboard.routes.settings.encryption.setup.title",
                  )}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate(
                     "dashboard.routes.settings.encryption.setup.description",
                  )}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody className="space-y-4">
               <Alert>
                  <Lock className="size-4" />
                  <AlertTitle>
                     {translate(
                        "dashboard.routes.settings.encryption.setup.how-it-works",
                     )}
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                     <p>
                        {translate(
                           "dashboard.routes.settings.encryption.setup.how-it-works-description",
                        )}
                     </p>
                  </AlertDescription>
               </Alert>

               <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>
                     {translate(
                        "dashboard.routes.settings.encryption.setup.warning-title",
                     )}
                  </AlertTitle>
                  <AlertDescription>
                     <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li>
                           {translate(
                              "dashboard.routes.settings.encryption.setup.warning-1",
                           )}
                        </li>
                        <li>
                           {translate(
                              "dashboard.routes.settings.encryption.setup.warning-2",
                           )}
                        </li>
                        <li>
                           {translate(
                              "dashboard.routes.settings.encryption.setup.warning-3",
                           )}
                        </li>
                     </ul>
                  </AlertDescription>
               </Alert>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => closeCredenza()} variant="outline">
                  {translate("common.actions.cancel")}
               </Button>
               <Button onClick={() => setStep("passphrase")}>
                  {translate("common.actions.continue")}
               </Button>
            </CredenzaFooter>
         </>
      );
   }

   if (step === "passphrase") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate(
                     "dashboard.routes.settings.encryption.setup.create-passphrase",
                  )}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate(
                     "dashboard.routes.settings.encryption.setup.create-passphrase-description",
                  )}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody>
               <form className="space-y-4" onSubmit={handleSubmit}>
                  <form.Field name="passphrase">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <FieldGroup>
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate(
                                       "dashboard.routes.settings.encryption.passphrase",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    aria-invalid={isInvalid}
                                    autoComplete="new-password"
                                    id={field.name}
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={translate(
                                       "dashboard.routes.settings.encryption.passphrase-placeholder",
                                    )}
                                    type="password"
                                    value={field.state.value}
                                 />
                                 <FieldDescription>
                                    {translate(
                                       "dashboard.routes.settings.encryption.passphrase-hint",
                                    )}
                                 </FieldDescription>
                                 {isInvalid && (
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
                                 )}
                              </Field>
                           </FieldGroup>
                        );
                     }}
                  </form.Field>

                  <form.Field name="confirmPassphrase">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <FieldGroup>
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate(
                                       "dashboard.routes.settings.encryption.confirm-passphrase",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    aria-invalid={isInvalid}
                                    autoComplete="new-password"
                                    id={field.name}
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={translate(
                                       "dashboard.routes.settings.encryption.confirm-passphrase-placeholder",
                                    )}
                                    type="password"
                                    value={field.state.value}
                                 />
                                 {isInvalid && (
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
                                 )}
                              </Field>
                           </FieldGroup>
                        );
                     }}
                  </form.Field>
               </form>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => setStep("intro")} variant="outline">
                  {translate("common.actions.back")}
               </Button>
               <form.Subscribe>
                  {(formState) => (
                     <Button
                        disabled={
                           formState.isSubmitting || formState.isValidating
                        }
                        onClick={handleContinueToConfirm}
                     >
                        {translate("common.actions.continue")}
                     </Button>
                  )}
               </form.Subscribe>
            </CredenzaFooter>
         </>
      );
   }

   if (step === "confirm") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate(
                     "dashboard.routes.settings.encryption.setup.confirm-title",
                  )}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate(
                     "dashboard.routes.settings.encryption.setup.confirm-description",
                  )}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody>
               <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>
                     {translate(
                        "dashboard.routes.settings.encryption.setup.final-warning-title",
                     )}
                  </AlertTitle>
                  <AlertDescription>
                     {translate(
                        "dashboard.routes.settings.encryption.setup.final-warning-description",
                     )}
                  </AlertDescription>
               </Alert>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => setStep("passphrase")} variant="outline">
                  {translate("common.actions.back")}
               </Button>
               <Button
                  disabled={isSubmitting}
                  onClick={() => form.handleSubmit()}
               >
                  {isSubmitting && (
                     <Loader2 className="size-4 mr-2 animate-spin" />
                  )}
                  {translate(
                     "dashboard.routes.settings.encryption.setup.enable-button",
                  )}
               </Button>
            </CredenzaFooter>
         </>
      );
   }

   if (step === "success") {
      return (
         <>
            <CredenzaHeader>
               <CredenzaTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  {translate(
                     "dashboard.routes.settings.encryption.setup.success-title",
                  )}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate(
                     "dashboard.routes.settings.encryption.setup.success-description",
                  )}
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody>
               <Alert>
                  <Shield className="size-4" />
                  <AlertTitle>
                     {translate(
                        "dashboard.routes.settings.encryption.setup.next-steps-title",
                     )}
                  </AlertTitle>
                  <AlertDescription>
                     <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li>
                           {translate(
                              "dashboard.routes.settings.encryption.setup.next-step-1",
                           )}
                        </li>
                        <li>
                           {translate(
                              "dashboard.routes.settings.encryption.setup.next-step-2",
                           )}
                        </li>
                     </ul>
                  </AlertDescription>
               </Alert>
            </CredenzaBody>

            <CredenzaFooter>
               <Button onClick={() => closeCredenza()}>
                  {translate("common.actions.done")}
               </Button>
            </CredenzaFooter>
         </>
      );
   }

   return null;
}

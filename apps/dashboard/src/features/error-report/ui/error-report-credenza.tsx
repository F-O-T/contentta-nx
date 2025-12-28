import { translate } from "@packages/localization";
import { captureClientEvent } from "@packages/posthog/client";
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
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { AlertCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useCredenza } from "@/hooks/use-credenza";

export type ErrorReportData = {
   errorId: string;
   path: string;
   code: string;
   message: string;
   userId?: string;
   organizationId?: string;
};

type ErrorReportCredenzaProps = {
   error: ErrorReportData;
};

export function ErrorReportCredenza({ error }: ErrorReportCredenzaProps) {
   const { closeCredenza } = useCredenza();
   const [submitted, setSubmitted] = useState(false);

   const form = useForm({
      defaultValues: {
         userNotes: "",
      },
      onSubmit: async ({ value }) => {
         captureClientEvent("user_error_report", {
            code: error.code,
            errorId: error.errorId,
            message: error.message,
            organizationId: error.organizationId,
            path: error.path,
            userId: error.userId,
            userNotes: value.userNotes.trim() || undefined,
         });

         setSubmitted(true);
         setTimeout(() => {
            closeCredenza();
         }, 1500);
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   if (submitted) {
      return (
         <CredenzaHeader>
            <CredenzaTitle>
               {translate("common.error-report.submitted-title")}
            </CredenzaTitle>
            <CredenzaDescription>
               {translate("common.error-report.submitted-description")}
            </CredenzaDescription>
         </CredenzaHeader>
      );
   }

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate("common.error-report.title")}
            </CredenzaTitle>
            <CredenzaDescription>
               {translate("common.error-report.description")}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody>
            <form className="grid gap-4" onSubmit={handleSubmit}>
               <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>{error.message}</AlertTitle>
                  <AlertDescription className="flex gap-2">
                     <span>{translate("common.error-report.error-id")}:</span>
                     <span>{error.errorId.slice(0, 8)}</span>
                  </AlertDescription>
               </Alert>

               <form.Field name="userNotes">
                  {(field) => (
                     <FieldGroup>
                        <Field>
                           <FieldLabel>
                              {translate(
                                 "common.error-report.additional-details",
                              )}
                           </FieldLabel>
                           <Textarea
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "common.error-report.additional-details-placeholder",
                              )}
                              rows={4}
                              value={field.state.value}
                           />
                        </Field>
                     </FieldGroup>
                  )}
               </form.Field>
            </form>
         </CredenzaBody>

         <CredenzaFooter>
            <Button onClick={() => closeCredenza()} variant="outline">
               {translate("common.actions.close")}
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={formState.isSubmitting}
                     onClick={() => form.handleSubmit()}
                  >
                     {formState.isSubmitting
                        ? translate("common.actions.sending")
                        : translate("common.error-report.send-report")}
                  </Button>
               )}
            </form.Subscribe>
         </CredenzaFooter>
      </>
   );
}

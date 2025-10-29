import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

export function SendInvitationCredenza({
   open,
   onOpenChange,
   organizationId,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   organizationId: string;
}) {
   const schema = z.object({
      email: z.email(translate("pages.organization.toasts.invalid-email")),
   });
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const sendInvitation = useCallback(
      async (values: z.infer<typeof schema>) => {
         await betterAuthClient.organization.inviteMember(
            {
               email: values.email,
               organizationId,
               role: "member",
            },
            {
               onError: (e) => {
                  console.error("Error sending invitation:", e);
                  toast.error(
                     translate("pages.organization.toasts.invitation-failed"),
                  );
               },
               onSuccess: async () => {
                  toast.success(
                     translate("pages.organization.toasts.invitation-sent", {
                        email: values.email,
                     }),
                  );
                  await queryClient.invalidateQueries({
                     queryKey:
                        trpc.authHelpers.getDefaultOrganization.queryKey(),
                  });
               },
            },
         );
      },
      [
         organizationId,
         queryClient,
         trpc.authHelpers.getDefaultOrganization.queryKey,
         trpc.authHelpers.getDefaultOrganization,
      ],
   );

   const form = useForm({
      defaultValues: { email: "" },
      onSubmit: async ({ value, formApi }) => {
         await sendInvitation(value);
         formApi.reset();
         onOpenChange(false);
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
      <Credenza onOpenChange={onOpenChange} open={open}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate("pages.organization.modals.invite.title")}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate("pages.organization.modals.invite.description")}
               </CredenzaDescription>
            </CredenzaHeader>
            <form onSubmit={handleSubmit}>
               <CredenzaBody>
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
                                       "pages.organization.modals.invite.email-label",
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
                                       "pages.organization.modals.invite.email-placeholder",
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
               </CredenzaBody>
               <CredenzaFooter>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           disabled={
                              !formState.canSubmit || formState.isSubmitting
                           }
                           type="submit"
                           variant="default"
                        >
                           {translate("pages.organization.modals.invite.send")}
                        </Button>
                     )}
                  </form.Subscribe>
               </CredenzaFooter>
            </form>
         </CredenzaContent>
      </Credenza>
   );
}

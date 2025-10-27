import { useAppForm } from "@packages/ui/components/form";
import { z } from "zod";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
} from "@packages/ui/components/credenza";
import {
   AlertDialog,
   AlertDialogContent,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogAction,
   AlertDialogCancel,
} from "@packages/ui/components/alert-dialog";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";
import { translate } from "@packages/localization";

const emailSchema = z.object({
   email: z
      .string()
      .email(
         translate("pages.profile.forms.update-email.validation.email-invalid"),
      ),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export function UpdateEmailForm({
   open,
   onOpenChange,
   currentEmail,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentEmail: string;
}) {
   const [confirmOpen, setConfirmOpen] = useState(false);
   const handleChangeEmail = useCallback(
      async (value: EmailFormValues, formApi: { reset: () => void }) => {
         await betterAuthClient.changeEmail(
            {
               newEmail: value.email,
               callbackURL: "/profile?emailChanged=1",
            },
            {
               onError: ({ error }: { error: Error }) => {
                  toast.error(
                     error?.message ||
                        translate(
                           "pages.profile.forms.update-email.messages.error",
                        ),
                  );
               },
               onRequest: () => {
                  toast.loading(
                     translate(
                        "pages.profile.forms.update-email.messages.loading",
                     ),
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate(
                        "pages.profile.forms.update-email.messages.success",
                     ),
                  );
                  formApi.reset();
                  onOpenChange(false);
               },
            },
         );
      },
      [onOpenChange],
   );
   const form = useAppForm({
      defaultValues: { email: currentEmail || "" },
      validators: { onBlur: emailSchema },
      onSubmit: async ({ value, formApi }) => {
         await handleChangeEmail(value, formApi);
      },
   });
   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate("pages.profile.forms.update-email.title")}
               </CredenzaTitle>
            </CredenzaHeader>
            <form
               onSubmit={form.handleSubmit}
               className="space-y-4 py-4"
               autoComplete="off"
            >
               <div>
                  <label className="text-sm font-medium">
                     {translate(
                        "pages.profile.forms.update-email.fields.current-email.label",
                     )}
                  </label>
                  <Input value={currentEmail} disabled className="bg-muted" />
               </div>
               <form.AppField name="email">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>
                           {translate(
                              "pages.profile.forms.update-email.fields.new-email.label",
                           )}
                        </field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="email"
                           autoComplete="email"
                           placeholder={translate(
                              "pages.profile.forms.update-email.fields.new-email.placeholder",
                           )}
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>{" "}
               <CredenzaFooter>
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => onOpenChange(false)}
                  >
                     {translate(
                        "pages.profile.forms.update-email.actions.cancel",
                     )}
                  </Button>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           type="button"
                           onClick={() => setConfirmOpen(true)}
                           disabled={!formState.canSubmit}
                        >
                           {translate(
                              "pages.profile.forms.update-email.actions.send",
                           )}
                        </Button>
                     )}
                  </form.Subscribe>{" "}
               </CredenzaFooter>
            </form>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
               <AlertDialogContent>
                  <AlertDialogHeader>
                     <AlertDialogTitle>
                        {translate(
                           "pages.profile.forms.update-email.confirm.title",
                        )}
                     </AlertDialogTitle>
                     <AlertDialogDescription>
                        {translate(
                           "pages.profile.forms.update-email.confirm.description",
                        )}
                     </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
                        {translate(
                           "pages.profile.forms.update-email.confirm.cancel",
                        )}
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={() => {
                           setConfirmOpen(false);
                           form.handleSubmit();
                        }}
                     >
                        {translate(
                           "pages.profile.forms.update-email.confirm.confirm",
                        )}
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>
         </CredenzaContent>
      </Credenza>
   );
}

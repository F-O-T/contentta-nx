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

const passwordSchema = z.object({
   currentPassword: z
      .string()
      .min(
         1,
         translate(
            "pages.profile.forms.update-password.validation.current-required",
         ),
      ),
   newPassword: z
      .string()
      .min(
         8,
         translate(
            "pages.profile.forms.update-password.validation.new-min-length",
         ),
      ),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function UpdatePasswordForm({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const [confirmOpen, setConfirmOpen] = useState(false);
   const handleChangePassword = useCallback(
      async (value: PasswordFormValues, formApi: { reset: () => void }) => {
         await betterAuthClient.changePassword(
            {
               currentPassword: value.currentPassword,
               newPassword: value.newPassword,
               revokeOtherSessions: true,
            },
            {
               onError: ({ error }: { error: Error }) => {
                  toast.error(
                     error?.message ||
                        translate(
                           "pages.profile.forms.update-password.messages.error",
                        ),
                  );
               },
               onRequest: () => {
                  toast.loading(
                     translate(
                        "pages.profile.forms.update-password.messages.loading",
                     ),
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate(
                        "pages.profile.forms.update-password.messages.success",
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
      defaultValues: { currentPassword: "", newPassword: "" },
      validators: { onBlur: passwordSchema },
      onSubmit: async ({ value, formApi }) => {
         await handleChangePassword(value, formApi);
      },
   });
   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate("pages.profile.forms.update-password.title")}
               </CredenzaTitle>
            </CredenzaHeader>
            <form
               onSubmit={form.handleSubmit}
               className="space-y-4 py-4"
               autoComplete="off"
            >
               <form.AppField name="currentPassword">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>
                           {translate(
                              "pages.profile.forms.update-password.fields.current-password.label",
                           )}
                        </field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="password"
                           autoComplete="current-password"
                           placeholder={translate(
                              "pages.profile.forms.update-password.fields.current-password.placeholder",
                           )}
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>{" "}
               <form.AppField name="newPassword">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>
                           {translate(
                              "pages.profile.forms.update-password.fields.new-password.label",
                           )}
                        </field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="password"
                           autoComplete="new-password"
                           placeholder={translate(
                              "pages.profile.forms.update-password.fields.new-password.placeholder",
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
                        "pages.profile.forms.update-password.actions.cancel",
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
                              "pages.profile.forms.update-password.actions.change",
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
                           "pages.profile.forms.update-password.confirm.title",
                        )}
                     </AlertDialogTitle>
                     <AlertDialogDescription>
                        {translate(
                           "pages.profile.forms.update-password.confirm.description",
                        )}
                     </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
                        {translate(
                           "pages.profile.forms.update-password.confirm.cancel",
                        )}
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={() => {
                           setConfirmOpen(false);
                           form.handleSubmit();
                        }}
                     >
                        {translate(
                           "pages.profile.forms.update-password.confirm.confirm",
                        )}
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>
         </CredenzaContent>
      </Credenza>
   );
}

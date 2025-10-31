import { translate } from "@packages/localization";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useForm } from "@tanstack/react-form";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";

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
   const form = useForm({
      defaultValues: { currentPassword: "", newPassword: "" },
      onSubmit: async ({ value, formApi }) => {
         await handleChangePassword(value, formApi);
      },
      validators: { onBlur: passwordSchema },
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
      <Sheet onOpenChange={onOpenChange} open={open}>
         <form autoComplete="off" onSubmit={(e) => handleSubmit(e)}>
            <SheetContent>
               <SheetHeader>
                  <SheetTitle>
                     {translate("pages.profile.forms.update-password.title")}
                  </SheetTitle>
                  <SheetDescription>
                     {translate(
                        "pages.profile.forms.update-password.description",
                     )}
                  </SheetDescription>
               </SheetHeader>
               <div className="px-2 space-y-4 py-4">
                  <FieldGroup>
                     <form.Field name="currentPassword">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate(
                                       "pages.profile.forms.update-password.fields.current-password.label",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    aria-invalid={isInvalid}
                                    autoComplete="current-password"
                                    id={field.name}
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={translate(
                                       "pages.profile.forms.update-password.fields.current-password.placeholder",
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
                           );
                        }}
                     </form.Field>
                  </FieldGroup>
                  <FieldGroup>
                     <form.Field name="newPassword">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate(
                                       "pages.profile.forms.update-password.fields.new-password.label",
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
                                       "pages.profile.forms.update-password.fields.new-password.placeholder",
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
                           );
                        }}
                     </form.Field>
                  </FieldGroup>
               </div>
               <SheetFooter>
                  <Button
                     onClick={() => onOpenChange(false)}
                     type="button"
                     variant="outline"
                  >
                     {translate(
                        "pages.profile.forms.update-password.actions.cancel",
                     )}
                  </Button>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           disabled={
                              !formState.canSubmit || formState.isSubmitting
                           }
                           onClick={() => setConfirmOpen(true)}
                           type="button"
                        >
                           {translate(
                              "pages.profile.forms.update-password.actions.change",
                           )}
                        </Button>
                     )}
                  </form.Subscribe>
               </SheetFooter>

               <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
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
                        <AlertDialogCancel
                           onClick={() => setConfirmOpen(false)}
                        >
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
            </SheetContent>
         </form>
      </Sheet>
   );
}

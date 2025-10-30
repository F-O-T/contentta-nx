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
   SheetDescription,
   Sheet,
   SheetContent,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useForm } from "@tanstack/react-form";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { type FormEvent } from "react";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";

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
               callbackURL: "/profile?emailChanged=1",
               newEmail: value.email,
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
   const form = useForm({
      defaultValues: { email: currentEmail || "" },
      onSubmit: async ({ value, formApi }) => {
         await handleChangeEmail(value, formApi);
      },
      validators: { onBlur: emailSchema },
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
                     {translate("pages.profile.forms.update-email.title")}
                  </SheetTitle>
                  <SheetDescription>
                     {translate("pages.profile.forms.update-email.description")}
                  </SheetDescription>
               </SheetHeader>
               <div className="px-2">
                  <div>
                     <label className="text-sm font-medium">
                        {translate(
                           "pages.profile.forms.update-email.fields.current-email.label",
                        )}
                     </label>
                     <Input
                        className="bg-muted"
                        disabled
                        value={currentEmail}
                     />
                  </div>
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
                                       "pages.profile.forms.update-email.fields.new-email.label",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    autoComplete="email"
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    aria-invalid={isInvalid}
                                    placeholder={translate(
                                       "pages.profile.forms.update-email.fields.new-email.placeholder",
                                    )}
                                    type="email"
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
                        "pages.profile.forms.update-email.actions.cancel",
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
                              "pages.profile.forms.update-email.actions.send",
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
                        <AlertDialogCancel
                           onClick={() => setConfirmOpen(false)}
                        >
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
            </SheetContent>
         </form>
      </Sheet>
   );
}

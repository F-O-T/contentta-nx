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
import { Dropzone } from "@packages/ui/components/dropzone";
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

const profileSchema = z.object({
   image: z.literal(null),
   name: z
      .string()
      .min(
         1,
         translate(
            "pages.profile.forms.update-profile.validation.name-required",
         ),
      ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function UpdateProfileForm({
   open,
   onOpenChange,
   currentName,
   currentImage,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentName: string;
   currentImage: string;
}) {
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [imageFile, setImageFile] = useState<File | null>(null);
   const handleUpdateProfile = useCallback(
      async (value: ProfileFormValues, formApi: { reset: () => void }) => {
         const imageUrl = currentImage;
         if (imageFile) {
            // TODO: implement image upload and return URL
            // Example: const uploaded = await uploadProfileImage(imageFile);
            // imageUrl = uploaded.url;
         }
         await betterAuthClient.updateUser(
            {
               image: imageUrl,
               name: value.name,
            },
            {
               onError: ({ error }: { error: Error }) => {
                  toast.error(
                     error?.message ||
                        translate(
                           "pages.profile.forms.update-profile.messages.error",
                        ),
                  );
               },
               onRequest: () => {
                  toast.loading(
                     translate(
                        "pages.profile.forms.update-profile.messages.loading",
                     ),
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate(
                        "pages.profile.forms.update-profile.messages.success",
                     ),
                  );
                  formApi.reset();
                  onOpenChange(false);
               },
            },
         );
      },
      [currentImage, imageFile, onOpenChange],
   );
   const form = useForm({
      defaultValues: { image: null, name: currentName },
      onSubmit: async ({ value, formApi }) => {
         await handleUpdateProfile(value, formApi);
      },
      validators: { onBlur: profileSchema },
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
                     {translate("pages.profile.forms.update-profile.title")}
                  </SheetTitle>
                  <SheetDescription>
                     {translate(
                        "pages.profile.forms.update-profile.description",
                     )}
                  </SheetDescription>
               </SheetHeader>
               <div className="px-2 space-y-4 py-4">
                  <FieldGroup>
                     <form.Field name="name">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;
                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    {translate(
                                       "pages.profile.forms.update-profile.fields.name.label",
                                    )}
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
                                       "pages.profile.forms.update-profile.fields.name.placeholder",
                                    )}
                                    type="text"
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
                  <div>
                     <label className="text-sm font-medium">
                        {translate(
                           "pages.profile.forms.update-profile.fields.image.label",
                        )}
                     </label>
                     <Dropzone
                        accept={{ "image/*": [] }}
                        maxFiles={1}
                        maxSize={2 * 1024 * 1024}
                        onDrop={(files) => setImageFile(files[0] || null)}
                     >
                        {imageFile ? (
                           <img
                              alt="Preview"
                              className="h-20 w-20 rounded-full object-cover mx-auto"
                              src={URL.createObjectURL(imageFile)}
                           />
                        ) : (
                           currentImage && (
                              <img
                                 alt="Current"
                                 className="h-20 w-20 rounded-full object-cover mx-auto"
                                 src={currentImage}
                              />
                           )
                        )}
                     </Dropzone>
                  </div>
               </div>
               <SheetFooter>
                  <Button
                     onClick={() => onOpenChange(false)}
                     type="button"
                     variant="outline"
                  >
                     {translate(
                        "pages.profile.forms.update-profile.actions.cancel",
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
                              "pages.profile.forms.update-profile.actions.save",
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
                              "pages.profile.forms.update-profile.confirm.title",
                           )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                           {translate(
                              "pages.profile.forms.update-profile.confirm.description",
                           )}
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel
                           onClick={() => setConfirmOpen(false)}
                        >
                           {translate(
                              "pages.profile.forms.update-profile.confirm.cancel",
                           )}
                        </AlertDialogCancel>
                        <AlertDialogAction
                           onClick={() => {
                              setConfirmOpen(false);
                              form.handleSubmit();
                           }}
                        >
                           {translate(
                              "pages.profile.forms.update-profile.confirm.confirm",
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

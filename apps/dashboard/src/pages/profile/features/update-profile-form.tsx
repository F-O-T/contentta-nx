import { useAppForm } from "@packages/ui/components/form";
import { z } from "zod";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Dropzone } from "@packages/ui/components/dropzone";
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

const profileSchema = z.object({
   name: z
      .string()
      .min(
         1,
         translate(
            "pages.profile.forms.update-profile.validation.name-required",
         ),
      ),
   image: z.literal(null),
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
               name: value.name,
               image: imageUrl,
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
   const form = useAppForm({
      defaultValues: { name: currentName, image: null },
      validators: { onBlur: profileSchema },
      onSubmit: async ({ value, formApi }) => {
         await handleUpdateProfile(value, formApi);
      },
   });
   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate("pages.profile.forms.update-profile.title")}
               </CredenzaTitle>
            </CredenzaHeader>
            <form
               onSubmit={form.handleSubmit}
               className="space-y-4 py-4"
               autoComplete="off"
            >
               <form.AppField name="name">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>
                           {translate(
                              "pages.profile.forms.update-profile.fields.name.label",
                           )}
                        </field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="text"
                           autoComplete="name"
                           placeholder={translate(
                              "pages.profile.forms.update-profile.fields.name.placeholder",
                           )}
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>{" "}
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
                           src={URL.createObjectURL(imageFile)}
                           alt="Preview"
                           className="h-20 w-20 rounded-full object-cover mx-auto"
                        />
                     ) : (
                        currentImage && (
                           <img
                              src={currentImage}
                              alt="Current"
                              className="h-20 w-20 rounded-full object-cover mx-auto"
                           />
                        )
                     )}
                  </Dropzone>
               </div>
               <CredenzaFooter>
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => onOpenChange(false)}
                  >
                     {translate(
                        "pages.profile.forms.update-profile.actions.cancel",
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
                              "pages.profile.forms.update-profile.actions.save",
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
                     <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
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
         </CredenzaContent>
      </Credenza>
   );
}

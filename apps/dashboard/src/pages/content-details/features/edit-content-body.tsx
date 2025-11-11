import type { ContentSelect } from "@packages/database/schema";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { FieldContainer, FieldMessage } from "@packages/ui/components/form";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { Field, useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";
export function EditContentBody({
   content,
   setEditing,
}: {
   content: ContentSelect;
   setEditing: (editing: boolean) => void;
}) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const editBodyMutation = useMutation(
      trpc.content.versions.editBodyAndCreateNewVersion.mutationOptions({
         onError: (error) => {
            console.error("Error editing content body:", error);
            toast.error(translate("pages.content-details.edit.error"));
         },
         onSuccess: async () => {
            toast.success(translate("pages.content-details.edit.success"));
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.get.queryKey({ id: content.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.versions.getVersions.queryKey({
                  contentId: content.id,
               }),
            });
         },
      }),
   );

   const editForm = useForm({
      defaultValues: { body: content?.body ?? "" },
      onSubmit: async ({ value, formApi }) => {
         await editBodyMutation.mutateAsync({
            body: value.body,
            id: content.id,
         });
         formApi.reset();
         await queryClient.invalidateQueries({
            queryKey: trpc.content.get.queryKey({ id: content.id }),
         });
         await queryClient.invalidateQueries({
            queryKey: trpc.content.listAllContent.queryKey(),
         });
         await queryClient.invalidateQueries({
            queryKey: trpc.content.versions.getVersions.queryKey({
               contentId: content.id,
            }),
         });
         setEditing(false);
      },
      validators: {
         onBlur: z.object({
            body: z
               .string()
               .min(
                  1,
                  translate(
                     "pages.content-details.edit.validation.body-required",
                  ),
               ),
         }),
      },
   });

   return (
      <form
         className="flex flex-col items-end gap-4"
         onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editForm.handleSubmit();
         }}
      >
         <editForm.Subscribe>
            {(formState) => (
               <div className="flex items-center gap-2">
                  <Button
                     aria-label={translate("pages.content-details.edit.save")}
                     disabled={!formState.canSubmit || formState.isSubmitting}
                     size="icon"
                     type="submit"
                     variant="ghost"
                  >
                     <span className="sr-only">
                        {translate("pages.content-details.edit.save")}
                     </span>
                     <Check size={20} />
                  </Button>
                  <Button
                     aria-label={translate("pages.content-details.edit.cancel")}
                     onClick={() => setEditing(false)}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <span className="sr-only">
                        {translate("pages.content-details.edit.cancel")}
                     </span>
                     <X size={20} />
                  </Button>
               </div>
            )}
         </editForm.Subscribe>

         <Field
            form={editForm}
            name="body"
            validators={{
               onBlur: z
                  .string()
                  .min(
                     1,
                     translate(
                        "pages.content-details.edit.validation.body-required",
                     ),
                  ),
            }}
         >
            {(field) => (
               <FieldContainer>
                  <TiptapEditor
                     error={field.state.meta.errors.length > 0}
                     onBlur={field.handleBlur}
                     onChange={field.handleChange}
                     placeholder={translate(
                        "pages.content-details.edit.placeholder",
                     )}
                     value={field.state.value}
                  />
                  <FieldMessage />
               </FieldContainer>
            )}
         </Field>
      </form>
   );
}

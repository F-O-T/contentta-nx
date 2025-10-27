import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
   CredenzaBody,
   CredenzaDescription,
} from "@packages/ui/components/credenza";
import { useAppForm } from "@packages/ui/components/form";
import { Input } from "@packages/ui/components/input";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { translate } from "@packages/localization";

export function UpdateApiKeyCredenza({
   keyId,
   open,
   onOpenChange,
   initialName = "",
}: {
   keyId: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   initialName?: string;
}) {
   const trpc = useTRPC();
   const schema = z.object({
      name: z
         .string(translate("common.form.field-required"))
         .min(1, translate("common.form.field-required")),
   });
   const queryClient = useQueryClient();

   const updateApiKey = useCallback(
      async (values: z.infer<typeof schema>) => {
         await betterAuthClient.apiKey.update(
            {
               keyId,
               name: values.name,
            },
            {
               onSuccess: async () => {
                  toast.success(
                     translate("pages.api-key.messages.update-success"),
                  );
                  await queryClient.invalidateQueries({
                     queryKey: trpc.authHelpers.getApiKeys.queryKey(),
                  });
                  onOpenChange(false);
               },
               onError: (e) => {
                  console.error("Error updating API key:", e);
                  toast.error(translate("pages.api-key.messages.update-error"));
               },
            },
         );
      },
      [
         keyId,
         queryClient,
         trpc.authHelpers.getApiKeys.queryKey,
         onOpenChange,
         trpc.authHelpers.getApiKeys,
      ],
   );

   const form = useAppForm({
      defaultValues: { name: initialName },
      validators: {
         onBlur: schema,
      },
      onSubmit: async ({ value, formApi }) => {
         await updateApiKey(value);
         formApi.reset();
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
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>
                  {translate("pages.api-key.modals.update.title")}
               </CredenzaTitle>
               <CredenzaDescription>
                  {translate("pages.api-key.modals.update.description")}
               </CredenzaDescription>
            </CredenzaHeader>
            <form onSubmit={handleSubmit}>
               <CredenzaBody>
                  <form.AppField name="name">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>
                              {translate(
                                 "pages.api-key.modals.update.name-label",
                              )}
                           </field.FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.api-key.modals.update.name-placeholder",
                              )}
                              value={field.state.value}
                           />
                           <field.FieldMessage />
                        </field.FieldContainer>
                     )}
                  </form.AppField>
               </CredenzaBody>
               <CredenzaFooter>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           className="w-full shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                           disabled={
                              !formState.canSubmit || formState.isSubmitting
                           }
                           type="submit"
                           variant="default"
                        >
                           {translate("pages.api-key.modals.update.update")}
                        </Button>
                     )}
                  </form.Subscribe>
               </CredenzaFooter>
            </form>
         </CredenzaContent>
      </Credenza>
   );
}

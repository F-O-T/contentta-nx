import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useForm } from "@tanstack/react-form";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useSheet } from "@/hooks/use-sheet";
import { betterAuthClient } from "@/integrations/clients";
import { invalidateApiKeys } from "./api-key-list";

const schema = z.object({
   name: z
      .string()
      .max(50, "O nome deve ter menos de 50 caracteres")
      .optional()
      .default(""),
});

interface EditApiKeyFormProps {
   keyId: string;
   currentName: string | null;
}

export function EditApiKeyForm({ keyId, currentName }: EditApiKeyFormProps) {
   const { closeSheet } = useSheet();
   const [isPending, setIsPending] = useState(false);

   const form = useForm({
      defaultValues: {
         name: currentName || "",
      },
      onSubmit: async ({ value, formApi }) => {
         setIsPending(true);

         await betterAuthClient.apiKey.update(
            {
               keyId,
               name: value.name || undefined,
            },
            {
               onSuccess: () => {
                  setIsPending(false);
                  toast.success("Chave de API atualizada com sucesso");
                  invalidateApiKeys();
                  closeSheet();
                  formApi.reset();
               },
               onError: (ctx) => {
                  setIsPending(false);
                  toast.error(ctx.error.message || "Falha ao atualizar chave de API");
               },
            },
         );
      },
      validators: {
         onBlur: schema as unknown as undefined,
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   return (
      <>
         <SheetHeader>
            <SheetTitle>Editar Chave de API</SheetTitle>
            <SheetDescription>
               Atualize o nome da sua chave de API
            </SheetDescription>
         </SheetHeader>

         <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
            <form.Field name="name">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Ex: Chave de Produção"
                           type="text"
                           value={field.state.value}
                        />
                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>
         </form>

         <SheetFooter>
            <Button onClick={closeSheet} type="button" variant="outline">
               Cancelar
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={formState.isSubmitting || isPending}
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
}

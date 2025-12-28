import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
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
import { openApiKeyCreatedDialog } from "./api-key-created-dialog";

const EXPIRATION_OPTIONS = [
   { label: "Nunca", value: "" },
   { label: "7 dias", value: "604800" }, // 7 * 24 * 60 * 60
   { label: "30 dias", value: "2592000" }, // 30 * 24 * 60 * 60
   { label: "90 dias", value: "7776000" }, // 90 * 24 * 60 * 60
   { label: "1 ano", value: "31536000" }, // 365 * 24 * 60 * 60
] as const;

const schema = z.object({
   name: z
      .string()
      .max(50, "O nome deve ter menos de 50 caracteres")
      .optional()
      .default(""),
   expiresIn: z.string().optional().default(""),
});

export function CreateApiKeyForm() {
   const { closeSheet } = useSheet();
   const [isPending, setIsPending] = useState(false);

   const form = useForm({
      defaultValues: {
         name: "",
         expiresIn: "",
      },
      onSubmit: async ({ value, formApi }) => {
         setIsPending(true);

         await betterAuthClient.apiKey.create(
            {
               name: value.name || undefined,
               expiresIn: value.expiresIn
                  ? Number.parseInt(value.expiresIn, 10)
                  : undefined,
            },
            {
               onSuccess: (res) => {
                  setIsPending(false);
                  if (res.data?.key) {
                     invalidateApiKeys();
                     closeSheet();
                     openApiKeyCreatedDialog(res.data.key, res.data.name);
                  }
                  formApi.reset();
               },
               onError: (ctx) => {
                  setIsPending(false);
                  toast.error(ctx.error.message || "Falha ao criar chave de API");
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
            <SheetTitle>Criar Chave de API</SheetTitle>
            <SheetDescription>
               Crie uma nova chave de API para autenticar aplicações externas
            </SheetDescription>
         </SheetHeader>

         <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
            <form.Field name="name">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Nome (opcional)
                        </FieldLabel>
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

            <form.Field name="expiresIn">
               {(field) => (
                  <Field>
                     <FieldLabel htmlFor={field.name}>Expiração</FieldLabel>
                     <Select
                        onValueChange={(value) => field.handleChange(value)}
                        value={field.state.value}
                     >
                        <SelectTrigger id={field.name}>
                           <SelectValue placeholder="Selecione a expiração" />
                        </SelectTrigger>
                        <SelectContent>
                           {EXPIRATION_OPTIONS.map((option) => (
                              <SelectItem
                                 key={option.value || "never"}
                                 value={option.value || "never"}
                              >
                                 {option.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </Field>
               )}
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
                     {isPending ? "Criando..." : "Criar Chave de API"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
}

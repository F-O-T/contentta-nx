import type { AgentSelect } from "@packages/database/schema";
import type {
   InstructionsConfig,
   PersonaConfig,
} from "@packages/database/schemas/agent";
import { type TranslationKey, translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
} from "@packages/ui/components/card";
import { Field, FieldError } from "@packages/ui/components/field";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";

interface EditInstructionCard {
   titleKey: TranslationKey;
   descriptionKey: TranslationKey;
   placeholderKey: TranslationKey;
   fieldName: keyof InstructionsConfig;
}

export function EditAgentInstructions({
   agent,
   setEditing,
}: {
   agent: AgentSelect;
   setEditing: (editing: boolean) => void;
}) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const personaConfig = agent.personaConfig as PersonaConfig;

   const instructionCards = useMemo(() => {
      return [
         {
            descriptionKey:
               "pages.agent-details.instructions.tabs.audience.description",
            fieldName: "audienceProfile" as const,
            placeholderKey:
               "pages.agent-details.instructions.tabs.audience.placeholder",
            titleKey: "pages.agent-details.instructions.tabs.audience.title",
         },
         {
            descriptionKey:
               "pages.agent-details.instructions.tabs.writing.description",
            fieldName: "writingGuidelines" as const,
            placeholderKey:
               "pages.agent-details.instructions.tabs.writing.placeholder",
            titleKey: "pages.agent-details.instructions.tabs.writing.title",
         },
         {
            descriptionKey:
               "pages.agent-details.instructions.tabs.rag.description",
            fieldName: "ragIntegration" as const,
            placeholderKey:
               "pages.agent-details.instructions.tabs.rag.placeholder",
            titleKey: "pages.agent-details.instructions.tabs.rag.title",
         },
      ] as EditInstructionCard[];
   }, []);

   const editInstructionsMutation = useMutation(
      trpc.agent.update.mutationOptions({
         onError: (error) => {
            console.error("Error editing agent instructions:", error);
            toast.error(
               translate("pages.agent-details.instructions.edit.error"),
            );
         },
         onSuccess: async () => {
            toast.success(
               translate("pages.agent-details.instructions.edit.success"),
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agent.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
         },
      }),
   );

   const editForm = useForm({
      defaultValues: {
         audienceProfile: personaConfig.instructions?.audienceProfile ?? "",
         ragIntegration: personaConfig.instructions?.ragIntegration ?? "",
         writingGuidelines: personaConfig.instructions?.writingGuidelines ?? "",
      },
      onSubmit: async ({ value }) => {
         const updatedPersonaConfig: PersonaConfig = {
            ...personaConfig,
            instructions: {
               audienceProfile: value.audienceProfile,
               ragIntegration: value.ragIntegration,
               writingGuidelines: value.writingGuidelines,
            },
         };

         await editInstructionsMutation.mutateAsync({
            id: agent.id,
            personaConfig: updatedPersonaConfig,
         });
         setEditing(false);
      },
      validators: {
         //TODO: Onblur is not working when using the schema from the database
         onBlur: z.object({
            audienceProfile: z.string(),
            ragIntegration: z.string(),
            writingGuidelines: z.string(),
         }),
      },
   });

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <div>
               <h3 className="text-lg font-semibold">
                  {translate("pages.agent-details.instructions.title")}
               </h3>
               <p className="text-sm text-muted-foreground">
                  {translate("pages.agent-details.instructions.description")}
               </p>
            </div>
            <div className="flex items-center gap-2">
               <Button
                  disabled={editInstructionsMutation.isPending}
                  onClick={() => setEditing(false)}
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  <X size={20} />
               </Button>
               <Button
                  disabled={
                     !editForm.state.canSubmit ||
                     editInstructionsMutation.isPending
                  }
                  onClick={() => editForm.handleSubmit()}
                  type="button"
               >
                  <Check size={20} />
               </Button>
            </div>
         </div>

         <Tabs defaultValue={instructionCards[0]?.titleKey}>
            <Card>
               <CardHeader className="">
                  <TabsList className="w-full">
                     {instructionCards.map((card) => (
                        <TabsTrigger key={card.titleKey} value={card.titleKey}>
                           {translate(card.titleKey)}
                        </TabsTrigger>
                     ))}
                  </TabsList>
               </CardHeader>
               <CardContent>
                  {instructionCards.map((card) => (
                     <TabsContent key={card.titleKey} value={card.titleKey}>
                        <div className="space-y-4">
                           <CardDescription>
                              {translate(card.descriptionKey)}
                           </CardDescription>
                           <editForm.Field name={card.fieldName}>
                              {(field) => {
                                 const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;
                                 return (
                                    <Field data-invalid={isInvalid}>
                                       <TiptapEditor
                                          onBlur={field.handleBlur}
                                          onChange={field.handleChange}
                                          placeholder={translate(
                                             card.placeholderKey,
                                          )}
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
                           </editForm.Field>
                        </div>
                     </TabsContent>
                  ))}
               </CardContent>
            </Card>
         </Tabs>
      </div>
   );
}

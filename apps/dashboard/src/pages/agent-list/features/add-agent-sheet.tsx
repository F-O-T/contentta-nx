import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { FC, FormEvent } from "react";
import { createContext, Suspense, useContext } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";

interface AddAgentSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

// Context to share onOpenChange function
const AddAgentContext = createContext<{
   onOpenChange: (open: boolean) => void;
} | null>(null);

// Hook to use the context
const useAddAgentContext = () => {
   const context = useContext(AddAgentContext);
   if (!context) {
      throw new Error(
         "useAddAgentContext must be used within AddAgentProvider",
      );
   }
   return context;
};

// Error Fallback Component
function AddAgentErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertTriangle className="h-4 w-4" />
         <AlertDescription>
            Failed to load agent creation form. Please try again.
         </AlertDescription>
      </Alert>
   );
}

// Loading Skeleton Component
function AddAgentSkeleton() {
   return (
      <div className="grid gap-4 px-4">
         <Skeleton className="h-4 w-20" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-32" />
         <Skeleton className="h-20 w-full" />
         <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
         </div>
      </div>
   );
}

const AddAgentSheetContent = () => {
   const { onOpenChange } = useAddAgentContext();
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const createAgentMutation = useMutation(
      trpc.agent.create.mutationOptions({
         onError: (error) => {
            console.error("Agent creation error:", error);
            toast.error("Failed to create agent");
         },
         onSuccess: async (_, variables) => {
            toast.success(
               `Agent "${variables.metadata.name}" created successfully`,
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
            onOpenChange(false);
         },
      }),
   );

   const schema = z.object({
      instructions: z.object({
         audienceProfile: z.string().optional(),
         ragIntegration: z.string().optional(),
         writingGuidelines: z.string().optional(),
      }),
      metadata: z.object({
         description: z
            .string()
            .min(1, "Description is required")
            .max(500, "Description must be less than 500 characters"),
         name: z
            .string()
            .min(1, "Agent name is required")
            .max(100, "Agent name must be less than 100 characters"),
      }),
      purpose: z.enum(["blog_post"]).default("blog_post"),
   });

   const form = useForm({
      defaultValues: {
         instructions: {
            audienceProfile: "",
            ragIntegration: "",
            writingGuidelines: "",
         },
         metadata: {
            description: "",
            name: "",
         },
         purpose: "blog_post" as const,
      },
      onSubmit: async ({ value, formApi }) => {
         await createAgentMutation.mutateAsync(value);
         formApi.reset();
      },

      validators: {
         onBlur: schema,
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   return (
      <>
         <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
            <form.Field name="metadata.name">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Agent Name</FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Enter agent name"
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

            <form.Field name="metadata.description">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Description
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Describe what this agent does..."
                           rows={3}
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="instructions.audienceProfile">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Audience Profile (Optional)
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Describe your target audience..."
                           rows={2}
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="instructions.ragIntegration">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           RAG Integration (Optional)
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Knowledge bases or documents to reference..."
                           rows={2}
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="instructions.writingGuidelines">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Writing Guidelines (Optional)
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Specific writing style or guidelines..."
                           rows={2}
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
            <Button
               onClick={() => onOpenChange(false)}
               type="button"
               variant="outline"
            >
               Cancel
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={
                        !formState.canSubmit ||
                        formState.isSubmitting ||
                        createAgentMutation.isPending
                     }
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {createAgentMutation.isPending
                        ? "Creating..."
                        : "Create Agent"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
};

export const AddAgentSheet: FC<AddAgentSheetProps> = ({
   open,
   onOpenChange,
}) => {
   return (
      <Sheet onOpenChange={onOpenChange} open={open}>
         <SheetContent>
            <SheetHeader>
               <SheetTitle className="">Create New Agent</SheetTitle>
               <SheetDescription>
                  Create a new AI agent to help you generate content
               </SheetDescription>
            </SheetHeader>
            <AddAgentContext.Provider value={{ onOpenChange }}>
               <ErrorBoundary FallbackComponent={AddAgentErrorFallback}>
                  <Suspense fallback={<AddAgentSkeleton />}>
                     <AddAgentSheetContent />
                  </Suspense>
               </ErrorBoundary>
            </AddAgentContext.Provider>
         </SheetContent>
      </Sheet>
   );
};

import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2 } from "lucide-react";
import type { FC, FormEvent } from "react";
import { toast } from "sonner";
import z from "zod";
import { useTRPC } from "@/integrations/clients";

interface CreateTeamSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

const createTeamSchema = z.object({
   name: z.string().min(1, "Team name is required").max(100, "Team name must be less than 100 characters"),
   description: z.string().optional(),
});

export const CreateTeamSheet: FC<CreateTeamSheetProps> = ({
   open,
   onOpenChange,
}) => {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Placeholder mutation - will need to be connected to actual API
   const createTeamMutation = useMutation({
      mutationFn: async (data: { name: string; description?: string }) => {
         // TODO: Implement actual team creation API call
         // For now, just simulate a delay
         await new Promise(resolve => setTimeout(resolve, 1000));
         return { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
      },
      onError: (error) => {
         console.error("Team creation error:", error);
         toast.error("Failed to create team");
      },
      onSuccess: async () => {
         toast.success("Team created successfully");
         // Invalidate teams query to refresh the list
         await queryClient.invalidateQueries({
            queryKey: trpc.organization.listTeams.queryKey(),
         });
         onOpenChange(false);
      },
   });

   const form = useForm({
      defaultValues: {
         name: "",
         description: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await createTeamMutation.mutateAsync(value);
         formApi.reset();
      },
      validators: {
         onBlur: (value) => createTeamSchema.parse(value),
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   return (
      <Sheet onOpenChange={onOpenChange} open={open}>
         <SheetContent>
            <SheetHeader>
               <SheetTitle className="flex items-center gap-2">
                  <Building2 className="size-5" />
                  Create New Team
               </SheetTitle>
               <SheetDescription>
                  Create a new team to organize your organization members
               </SheetDescription>
            </SheetHeader>

            <form className="grid gap-4 px-4 py-4" onSubmit={handleSubmit}>
               <form.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Team Name *
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="Enter team name"
                              value={field.state.value}
                           />

                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>

               <form.Field name="description">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>
                           Description
                        </FieldLabel>
                        <Textarea
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Optional team description"
                           rows={3}
                           value={field.state.value}
                        />
                     </Field>
                  )}
               </form.Field>

               <Alert>
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                     Teams help you organize members and control access to different projects or resources within your organization.
                  </AlertDescription>
               </Alert>
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
                           createTeamMutation.isPending
                        }
                        onClick={() => form.handleSubmit()}
                        type="submit"
                     >
                        {createTeamMutation.isPending
                           ? "Creating..."
                           : "Create Team"}
                     </Button>
                  )}
               </form.Subscribe>
            </SheetFooter>
         </SheetContent>
      </Sheet>
   );
};
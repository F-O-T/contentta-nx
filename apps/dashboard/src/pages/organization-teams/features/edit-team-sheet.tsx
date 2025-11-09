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
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, Edit } from "lucide-react";
import { type FC, type FormEvent, useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import { useTRPC } from "@/integrations/clients";

interface EditTeamSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   team?: any;
}

const editTeamSchema = z.object({
   description: z.string().optional(),
   name: z
      .string()
      .min(1, "Team name is required")
      .max(100, "Team name must be less than 100 characters"),
});

export const EditTeamSheet: FC<EditTeamSheetProps> = ({
   open,
   onOpenChange,
   team,
}) => {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Placeholder mutation - will need to be connected to actual API
   const updateTeamMutation = useMutation({
      mutationFn: async (data: {
         id: string;
         name: string;
         description?: string;
      }) => {
         // TODO: Implement actual team update API call
         // For now, just simulate a delay
         await new Promise((resolve) => setTimeout(resolve, 1000));
         return { ...data, updatedAt: new Date().toISOString() };
      },
      onError: (error) => {
         console.error("Team update error:", error);
         toast.error("Failed to update team");
      },
      onSuccess: async () => {
         toast.success("Team updated successfully");
         // Invalidate teams query to refresh the list
         await queryClient.invalidateQueries({
            queryKey: trpc.organization.listTeams.queryKey(),
         });
         onOpenChange(false);
      },
   });

   const form = useForm({
      defaultValues: {
         description: team?.description || "",
         name: team?.name || "",
      },
      onSubmit: async ({ value, formApi }) => {
         if (!team?.id) {
            toast.error("No team selected for editing");
            return;
         }

         await updateTeamMutation.mutateAsync({
            description: value.description,
            id: team.id,
            name: value.name,
         });
      },
      validators: {
         onBlur: (value) => editTeamSchema.parse(value),
      },
   });

   // Reset form when team changes
   useEffect(() => {
      if (team) {
         form.setFieldValue("name", team.name || "");
         form.setFieldValue("description", team.description || "");
      }
   }, [team, form]);

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
                  <Edit className="size-5" />
                  Edit Team
               </SheetTitle>
               <SheetDescription>
                  Update team information and settings
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
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
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
                     {team ? (
                        <>
                           Editing team: <strong>{team.name}</strong>
                           <br />
                           Team ID:{" "}
                           <code className="text-xs bg-muted px-1 rounded">
                              {team.id}
                           </code>
                        </>
                     ) : (
                        "No team selected for editing."
                     )}
                  </AlertDescription>
               </Alert>

               {!team && (
                  <Alert variant="destructive">
                     <AlertTriangle className="h-4 w-4" />
                     <AlertDescription>
                        Please select a team to edit.
                     </AlertDescription>
                  </Alert>
               )}
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
                           updateTeamMutation.isPending ||
                           !team
                        }
                        onClick={() => form.handleSubmit()}
                        type="submit"
                     >
                        {updateTeamMutation.isPending
                           ? "Updating..."
                           : "Update Team"}
                     </Button>
                  )}
               </form.Subscribe>
            </SheetFooter>
         </SheetContent>
      </Sheet>
   );
};

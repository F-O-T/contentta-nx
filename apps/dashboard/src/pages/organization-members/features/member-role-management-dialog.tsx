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
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getInitials } from "@packages/utils/text";
import { AlertTriangle, Edit, Shield, User, UserCheck } from "lucide-react";
import { FC, FormEvent, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { useTRPC } from "@/integrations/clients";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";

interface MemberRoleManagementDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   member?: any;
}

const roleManagementSchema = z.object({
   role: z.enum(["member", "admin", "owner"]),
});

const roleOptions = [
   {
      value: "member",
      label: "Member",
      icon: <User className="size-3" />,
      description: "Regular access to organization resources",
   },
   {
      value: "admin",
      label: "Admin",
      icon: <UserCheck className="size-3" />,
      description: "Can manage members and organization settings",
   },
   {
      value: "owner",
      label: "Owner",
      icon: <Shield className="size-3" />,
      description: "Full control over the organization",
   },
];

export const MemberRoleManagementDialog: FC<
   MemberRoleManagementDialogProps
> = ({ open, onOpenChange, member }) => {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   // Placeholder mutation - will need to be connected to actual API
   const updateRoleMutation = useMutation({
      mutationFn: async (data: { memberId: string; role: string }) => {
         // TODO: Implement actual role update API call
         // For now, just simulate a delay
         await new Promise((resolve) => setTimeout(resolve, 1000));
         return { success: true, ...data };
      },
      onError: (error) => {
         console.error("Failed to update member role", error);
         toast.error("Failed to update member role. Please try again.");
      },
      onSuccess: async (_, variables) => {
         toast.success(`Successfully updated role to ${variables.role}`);
         // Invalidate organization data to refresh the members list
         await queryClient.invalidateQueries({
            queryKey: trpc.organization.getActiveOrganization.queryKey(),
         });
         onOpenChange(false);
      },
   });

   const form = useForm({
      defaultValues: {
         role: member?.role || "member",
      },
      onSubmit: async ({ value, formApi }) => {
         if (!member?.id) {
            toast.error("No member selected for role update");
            return;
         }

         await updateRoleMutation.mutateAsync({
            memberId: member.id,
            role: value.role,
         });
      },
      validators: {
         onBlur: (value) => roleManagementSchema.parse(value),
      },
   });

   // Reset form when member changes
   useEffect(() => {
      if (member) {
         form.setFieldValue("role", member.role || "member");
      }
   }, [member, form]);

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   const currentRoleOption = roleOptions.find(
      (option) => option.value === form.getFieldValue("role"),
   );

   return (
      <AlertDialog onOpenChange={onOpenChange} open={open}>
         <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
               <AlertDialogTitle className="flex items-center gap-2">
                  <Edit className="size-5" />
                  Manage Member Role
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {member ? (
                     <>
                        Change the role for{" "}
                        <strong>
                           {member.user?.name || member.user?.email}
                        </strong>
                     </>
                  ) : (
                     "No member selected for role management."
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>

            {member && (
               <div className="py-4">
                  <div className="flex items-center gap-3 mb-4">
                     <Avatar className="size-10">
                        <AvatarImage
                           src={member.user?.image || undefined}
                           alt={member.user?.name || "Avatar"}
                        />
                        <AvatarFallback>
                           {getInitials(
                              member.user?.name ||
                                 member.user?.email ||
                                 "Unknown",
                           )}
                        </AvatarFallback>
                     </Avatar>
                     <div className="flex-1">
                        <div className="font-medium">
                           {member.user?.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                           {member.user?.email}
                        </div>
                        <div className="mt-1">
                           <Badge variant="outline" className="text-xs">
                              Current role: {member.role || "member"}
                           </Badge>
                        </div>
                     </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                     <form.Field name="role">
                        {(field) => {
                           const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid;

                           return (
                              <Field data-invalid={isInvalid}>
                                 <FieldLabel htmlFor={field.name}>
                                    New Role
                                 </FieldLabel>
                                 <Select
                                    value={field.state.value}
                                    onValueChange={(value) =>
                                       field.handleChange(value)
                                    }
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {roleOptions.map((option) => (
                                          <SelectItem
                                             key={option.value}
                                             value={option.value}
                                          >
                                             <div className="flex items-center gap-2">
                                                {option.icon}
                                                <div>
                                                   <div className="font-medium">
                                                      {option.label}
                                                   </div>
                                                   <div className="text-xs text-muted-foreground">
                                                      {option.description}
                                                   </div>
                                                </div>
                                             </div>
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>

                                 {isInvalid && (
                                    <FieldError
                                       errors={field.state.meta.errors}
                                    />
                                 )}
                              </Field>
                           );
                        }}
                     </form.Field>

                     {currentRoleOption && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                           <div className="flex items-center gap-2 text-sm">
                              {currentRoleOption.icon}
                              <span className="font-medium">
                                 {currentRoleOption.label}:
                              </span>
                              <span className="text-muted-foreground">
                                 {currentRoleOption.description}
                              </span>
                           </div>
                        </div>
                     )}
                  </form>
               </div>
            )}

            <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <form.Subscribe>
                  {(formState) => (
                     <Button
                        disabled={
                           !formState.canSubmit ||
                           formState.isSubmitting ||
                           updateRoleMutation.isPending ||
                           !member
                        }
                        onClick={() => form.handleSubmit()}
                        type="submit"
                     >
                        {updateRoleMutation.isPending
                           ? "Updating..."
                           : "Update Role"}
                     </Button>
                  )}
               </form.Subscribe>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
};

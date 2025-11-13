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
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { useForm } from "@tanstack/react-form";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { AlertTriangle, UserPlus } from "lucide-react";
import type { FC, FormEvent } from "react";
import { createContext, Suspense, useContext } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";

interface InviteMemberSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

// Context to share onOpenChange function
const InviteMemberContext = createContext<{
   onOpenChange: (open: boolean) => void;
} | null>(null);

// Hook to use the context
const useInviteMemberContext = () => {
   const context = useContext(InviteMemberContext);
   if (!context) {
      throw new Error(
         "useInviteMemberContext must be used within InviteMemberProvider",
      );
   }
   return context;
};

// Error Fallback Component
function InviteMemberErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertTriangle className="h-4 w-4" />
         <AlertDescription>
            Failed to load organization data. Please try again.
         </AlertDescription>
      </Alert>
   );
}

// Loading Skeleton Component
function InviteMemberSkeleton() {
   return (
      <div className="grid gap-4 px-4">
         <Skeleton className="h-4 w-20" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-10 w-full" />
         <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
         </div>
      </div>
   );
}

const InviteMemberSheetContent = () => {
   const { onOpenChange } = useInviteMemberContext();
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { data: organization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const createInvitationMutation = useMutation(
      trpc.organizationInvites.createInvitation.mutationOptions({
         onError: (error) => {
            console.error("Invitation creation error:", error);
            toast.error("Failed to send invitation");
         },
         onSuccess: async (_, variables) => {
            toast.success(`Invitation sent to ${variables.email}`);
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganizationMembers.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.organizationInvites.listInvitations.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.organizationInvites.getInvitationStats.queryKey(),
            });
            onOpenChange(false);
         },
      }),
   );

   const schema = z.object({
      email: z.string().email("Valid email is required"),
      organizationId: z.string().optional(),
      role: z.enum(["member", "admin"]),
   });

   const form = useForm({
      defaultValues: {
         email: "",
         organizationId: organization?.id,
         role: "member" as "member" | "admin",
      },
      onSubmit: async ({ value, formApi }) => {
         await createInvitationMutation.mutateAsync(value);
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
            <form.Field name="email">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Enter email address"
                           type="email"
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="role">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                        <Select
                           value={field.state.value}
                           onValueChange={(value) => field.handleChange(value as "member" | "admin")}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                           </SelectContent>
                        </Select>

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
                        createInvitationMutation.isPending
                     }
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {createInvitationMutation.isPending
                        ? "Sending..."
                        : "Send Invitation"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
};

export const InviteMemberSheet: FC<InviteMemberSheetProps> = ({
   open,
   onOpenChange,
}) => {
   return (
      <Sheet onOpenChange={onOpenChange} open={open}>
         <SheetContent>
            <SheetHeader>
               <SheetTitle className="">Invite New Member</SheetTitle>
               <SheetDescription>
                  Send an invitation to join your organization
               </SheetDescription>
            </SheetHeader>
            <InviteMemberContext.Provider value={{ onOpenChange }}>
               <ErrorBoundary FallbackComponent={InviteMemberErrorFallback}>
                  <Suspense fallback={<InviteMemberSkeleton />}>
                     <InviteMemberSheetContent />
                  </Suspense>
               </ErrorBoundary>
            </InviteMemberContext.Provider>
         </SheetContent>
      </Sheet>
   );
};
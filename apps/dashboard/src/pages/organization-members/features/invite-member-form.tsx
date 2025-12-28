import { Alert, AlertDescription } from "@packages/ui/components/alert";
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
import { Skeleton } from "@packages/ui/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { AlertTriangle } from "lucide-react";
import type { FC, FormEvent } from "react";
import { Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { betterAuthClient } from "@/integrations/clients";

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

const InviteMemberFormContent = () => {
   const { closeSheet } = useSheet();
   const { activeOrganization } = useActiveOrganization();
   const [isPending, setIsPending] = useState(false);

   const inviteMember = useCallback(
      async (data: {
         email: string;
         role: "member" | "admin" | "owner";
         organizationId?: string;
      }) => {
         await betterAuthClient.organization.inviteMember(
            {
               email: data.email,
               organizationId: data.organizationId,
               role: data.role,
            },
            {
               onRequest: () => {
                  setIsPending(true);
                  toast.loading("Sending invitation...");
               },
               onSuccess: () => {
                  setIsPending(false);
                  toast.success("Invitation sent successfully");
                  closeSheet();
               },
               onError: (ctx) => {
                  setIsPending(false);
                  toast.error(ctx.error.message || "Failed to send invitation");
               },
            },
         );
      },
      [closeSheet],
   );

   const schema = z.object({
      email: z.string().email("Valid email is required"),
      organizationId: z.string().default(""),
      role: z.enum(["member", "admin"]),
   });

   const form = useForm({
      defaultValues: {
         email: "",
         organizationId: activeOrganization?.id ?? "",
         role: "member" as "member" | "admin",
      },
      onSubmit: async ({ value, formApi }) => {
         await inviteMember({
            email: value.email,
            organizationId: value.organizationId || undefined,
            role: value.role,
         });
         formApi.reset();
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
         <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
            <form.Field name="email">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Email Address
                        </FieldLabel>
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
                           onValueChange={(value) =>
                              field.handleChange(value as "member" | "admin")
                           }
                           value={field.state.value}
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
            <Button onClick={closeSheet} type="button" variant="outline">
               Cancel
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={
                        !formState.canSubmit ||
                        formState.isSubmitting ||
                        isPending
                     }
                     onClick={() => form.handleSubmit()}
                     type="submit"
                  >
                     {isPending ? "Sending..." : "Send Invitation"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </>
   );
};

export const InviteMemberForm: FC = () => {
   return (
      <>
         <SheetHeader>
            <SheetTitle className="">Invite New Member</SheetTitle>
            <SheetDescription>
               Send an invitation to join your organization
            </SheetDescription>
         </SheetHeader>
         <ErrorBoundary FallbackComponent={InviteMemberErrorFallback}>
            <Suspense fallback={<InviteMemberSkeleton />}>
               <InviteMemberFormContent />
            </Suspense>
         </ErrorBoundary>
      </>
   );
};

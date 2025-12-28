import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

interface Organization {
   id: string;
   name: string;
}

interface UseDeleteOrganizationParams {
   organization: Organization | null | undefined;
   onSuccess?: () => void;
}

export function useDeleteOrganization({
   organization,
   onSuccess,
}: UseDeleteOrganizationParams) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();
   const [isDeleting, setIsDeleting] = useState(false);

   const { setActiveOrganization } = useSetActiveOrganization({
      showToast: false,
   });

   const handleDeleteSuccess = useCallback(async () => {
      const wasActiveOrganization = !!organization;
      if (!wasActiveOrganization) {
         onSuccess?.();
         setIsDeleting(false);
         return;
      }

      const updatedOrganizations = await queryClient.fetchQuery(
         trpc.organization.getOrganizations.queryOptions(),
      );

      if (updatedOrganizations && updatedOrganizations.length > 0) {
         await setActiveOrganization({
            organizationId: updatedOrganizations[0]?.id,
         });
      }

      onSuccess?.();
      setIsDeleting(false);
   }, [organization, onSuccess, queryClient, trpc, setActiveOrganization]);

   const deleteOrganization = useCallback(() => {
      openAlertDialog({
         actionLabel: "Delete Organization",
         description:
            "This action will permanently delete your organization and all its data. This action cannot be undone.",
         onAction: async () => {
            if (!organization?.id) return;
            setIsDeleting(true);
            await betterAuthClient.organization.delete(
               {
                  organizationId: organization.id,
               },
               {
                  onRequest: () => {
                     toast.loading("Deleting organization...");
                  },
                  onSuccess: async () => {
                     toast.success("Organization deleted successfully");
                     await handleDeleteSuccess();
                  },
                  onError: (ctx) => {
                     setIsDeleting(false);
                     toast.error(
                        ctx.error.message || "Failed to delete organization",
                     );
                  },
               },
            );
         },
         title: "Delete Organization",
         variant: "destructive",
      });
   }, [openAlertDialog, organization, handleDeleteSuccess]);

   return {
      deleteOrganization,
      isDeleting,
   };
}

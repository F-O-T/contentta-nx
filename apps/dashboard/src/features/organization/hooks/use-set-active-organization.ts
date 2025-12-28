import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface SetActiveOrganizationParams {
   organizationId?: string | null;
   organizationSlug?: string;
}

interface UseSetActiveOrganizationOptions {
   onSuccess?: () => void;
   onError?: (error: Error) => void;
   showToast?: boolean;
}

export function useSetActiveOrganization(
   options?: UseSetActiveOrganizationOptions,
) {
   const [isPending, setIsPending] = useState(false);
   const showToast = options?.showToast ?? true;

   const setActiveOrganization = useCallback(
      async (params: SetActiveOrganizationParams) => {
         setIsPending(true);
         const toastId = showToast
            ? toast.loading("Switching organization...")
            : undefined;

         try {
            const result = await betterAuthClient.organization.setActive({
               organizationId: params.organizationId,
               organizationSlug: params.organizationSlug,
            });

            if (result.error) {
               throw new Error(result.error.message);
            }

            if (showToast && toastId) {
               toast.success("Organization switched successfully", {
                  id: toastId,
               });
            }

            options?.onSuccess?.();

            return result.data;
         } catch (error) {
            const errorMessage =
               error instanceof Error
                  ? error.message
                  : "Failed to switch organization";
            if (showToast && toastId) {
               toast.error(errorMessage, { id: toastId });
            }
            options?.onError?.(
               error instanceof Error ? error : new Error(errorMessage),
            );
            throw error;
         } finally {
            setIsPending(false);
         }
      },
      [options, showToast],
   );

   return { isPending, setActiveOrganization };
}

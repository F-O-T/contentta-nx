import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { createToast } from "@/features/error-modal/lib/create-toast";
import { useTRPC } from "@/integrations/clients";

export function NotificationSettingsSection() {
   const trpc = useTRPC();
   // Fetch workflow preferences
   const { data } = useSuspenseQuery(
      trpc.preferences.getWorkflow.queryOptions(),
   );
   const queryClient = useQueryClient();
   const updateWorkflowMutation = useMutation(
      trpc.preferences.updateWorkflow.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.preferences.getWorkflow.queryKey(),
            });
         },
      }),
   );

   const handleToggleMissingImages = async (checked: boolean) => {
      try {
         await updateWorkflowMutation.mutateAsync({
            notifyMissingImages: checked,
         });

         createToast({
            message: "Preference updated successfully",
            type: "success",
         });
      } catch (error) {
         createToast({
            message: "Failed to update preference",
            type: "danger",
         });
         console.error("Error updating workflow preference:", error);
      }
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("pages.profile.notifications.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.profile.notifications.description")}
            </CardDescription>
         </CardHeader>

         <CardContent>
            <Item className="p-0">
               <ItemMedia variant="icon">
                  <Bell className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate(
                        "pages.profile.notifications.items.missing-images.title",
                     )}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "pages.profile.notifications.items.missing-images.description",
                     )}
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Switch
                     aria-label={translate(
                        "pages.profile.notifications.items.missing-images.label",
                     )}
                     checked={data?.notifyMissingImages ?? true}
                     onCheckedChange={handleToggleMissingImages}
                  />
               </ItemActions>
            </Item>
         </CardContent>
      </Card>
   );
}

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { toast } from "@packages/ui/components/sonner";
import { Switch } from "@packages/ui/components/switch";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { AlertCircle, Bell } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function NotificationSettingsErrorFallback() {
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
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate(
                        "pages.profile.notifications.state.error.title",
                     )}
                  </EmptyTitle>
                  <EmptyDescription>
                     {translate(
                        "pages.profile.notifications.state.error.description",
                     )}
                  </EmptyDescription>
               </EmptyHeader>
               <EmptyContent>
                  <Button
                     onClick={() => window.location.reload()}
                     size="sm"
                     variant="outline"
                  >
                     {translate("common.actions.retry")}
                  </Button>
               </EmptyContent>
            </Empty>
         </CardContent>
      </Card>
   );
}

function NotificationSettingsSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Item className="p-0">
               <ItemMedia variant="icon">
                  <Skeleton className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     <Skeleton className="h-5 w-1/2" />
                  </ItemTitle>
                  <ItemDescription>
                     <Skeleton className="h-4 w-3/4" />
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Skeleton className="size-8" />
               </ItemActions>
            </Item>
         </CardContent>
      </Card>
   );
}

function NotificationSettingsContent() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.preferences.getWorkflow.queryOptions(),
   );
   const queryClient = useQueryClient();
   const updateWorkflowMutation = useMutation(
      trpc.preferences.updateWorkflow.mutationOptions({
         onError: () => {
            toast.error("Failed to update preference");
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.preferences.getWorkflow.queryKey(),
            });
            toast.success("Preference updated");
         },
      }),
   );

   const handleToggleMissingImages = async (checked: boolean) => {
      await updateWorkflowMutation.mutateAsync({
         notifyMissingImages: checked,
      });
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
            <Item>
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

export function NotificationSettingsSection() {
   return (
      <ErrorBoundary FallbackComponent={NotificationSettingsErrorFallback}>
         <Suspense fallback={<NotificationSettingsSkeleton />}>
            <NotificationSettingsContent />
         </Suspense>
      </ErrorBoundary>
   );
}

import { ContentaChat } from "@contentagen/assistant-widget";
import { getCurrentLanguage } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
   createFileRoute,
   Outlet,
   useLocation,
   useRouter,
} from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ErrorComponent } from "@/default/error";
import { PendingComponent } from "@/default/pending";
import { useTRPC } from "@/integrations/clients";
import { DashboardLayout } from "@/layout/dashboard-layout";

export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
   errorComponent: ErrorComponent,
   loader: async ({ context }) => {
      await context.queryClient.prefetchQuery(
         context.trpc.authHelpers.getSession.queryOptions(),
      );
   },
   pendingComponent: () => (
      <div className="h-screen w-screen">
         <PendingComponent />
      </div>
   ),
   wrapInSuspense: true,
});

function RouteComponent() {
   const location = useLocation();
   const router = useRouter();
   const trpc = useTRPC();
   const { data: session, error } = useSuspenseQuery(
      trpc.authHelpers.getSession.queryOptions(),
   );

   useEffect(() => {
      if (error) {
         toast.error("Failed to fetch session data.");
         router.navigate({
            replace: true,
            search: location.search,
            to: "/auth/sign-in",
         });
         return;
      }
      if (!session) {
         toast.error("You must be logged in to access this page.");
         router.navigate({
            replace: true,
            search: location.search,
            to: "/auth/sign-in",
         });
      }
   }, [session, location, router, error]);

   const mutation = useMutation(trpc.assistant.sendMessage.mutationOptions());
   const sendMessage = useCallback(
      async (message: string) => {
         const response = await mutation.mutateAsync({ message });
         return response;
      },
      [mutation],
   );
   return (
      <DashboardLayout>
         <div
            className="duration-700 animate-in slide-in-from-bottom-4 fade-in h-full w-full"
            key={location.pathname}
         >
            <Popover>
               <PopoverTrigger asChild>
                  <Button
                     className="fixed bottom-4 right-4 z-50"
                     size="icon"
                     variant={"outline"}
                  >
                     <MessageCircle className="h-6 w-6" />
                  </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-full p-0">
                  <ContentaChat
                     locale={getCurrentLanguage()}
                     sendMessage={sendMessage}
                  />
               </PopoverContent>
            </Popover>

            <Outlet />
         </div>
      </DashboardLayout>
   );
}

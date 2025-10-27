import { ContentaChat } from "@contentagen/assistant-widget";
import i18n, { type SupportedLng } from "@packages/localization";
import { MessageCircle } from "lucide-react";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { Button } from "@packages/ui/components/button";
import {
   createFileRoute,
   useLocation,
   useRouter,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/layout/dashboard-layout";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PendingComponent } from "@/default/pending";
import { ErrorComponent } from "@/default/error";
import { useCallback, useEffect } from "react";
export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
   wrapInSuspense: true,
   pendingComponent: () => (
      <div className="h-screen w-screen">
         <PendingComponent />
      </div>
   ),
   errorComponent: ErrorComponent,
   loader: async ({ context }) => {
      await context.queryClient.prefetchQuery(
         context.trpc.authHelpers.getSession.queryOptions(),
      );
   },
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
            to: "/auth/sign-in",
            search: location.search,
            replace: true,
         });
         return;
      }
      if (!session) {
         toast.error("You must be logged in to access this page.");
         router.navigate({
            to: "/auth/sign-in",
            search: location.search,
            replace: true,
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
      <DashboardLayout session={session}>
         <div
            className="duration-700 animate-in slide-in-from-bottom-4 fade-in h-full w-full"
            key={location.pathname}
         >
            <Popover>
               <PopoverTrigger asChild>
                  <Button
                     size="icon"
                     variant={"outline"}
                     className="fixed bottom-4 right-4 z-50"
                  >
                     <MessageCircle className="h-6 w-6" />
                  </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-full p-0">
                  <ContentaChat
                     locale={i18n.language as SupportedLng}
                     sendMessage={sendMessage}
                  />
               </PopoverContent>
            </Popover>

            <Outlet />
         </div>
      </DashboardLayout>
   );
}

import { clientEnv } from "@packages/environment/client";
import { NotFoundComponent } from "@/default/not-found";
import { QueryProvider, useTRPC } from "@/integrations/clients";
import { ThemeProvider } from "@/layout/theme-provider";
import "@packages/localization";
import { translate } from "@packages/localization";
import { PostHogWrapper, PosthogRouterTracker } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   createRootRoute,
   HeadContent,
   Outlet,
   redirect,
   useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { GlobalAlertDialog } from "@/hooks/use-alert-dialog";
import { GlobalCredenza } from "@/hooks/use-credenza";
import { GlobalSheet } from "@/hooks/use-sheet";

declare module "@tanstack/react-router" {
   interface StaticDataRouteOption {
      breadcrumb?: string;
   }
}
export const Route = createRootRoute({
   component: RootComponent,
   head: () => ({
      links: [
         {
            href: "/favicon.svg",
            rel: "icon",
         },
      ],
      meta: [
         {
            content: translate("common.brand.description"),
            name: "description",
         },
         {
            title: translate("common.brand.name"),
         },
      ],
   }),
   loader: async ({ location }: { location: { href: string } }) => {
      if (location.href === "/") {
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   notFoundComponent: () => (
      <div className="h-screen w-screen">
         <NotFoundComponent />
      </div>
   ),
   staticData: {
      breadcrumb: "Home",
   },
   wrapInSuspense: true,
});

function TelemetryAwarePostHogWrapper({
   children,
}: {
   children: React.ReactNode;
}) {
   const trpc = useTRPC();
   const location = useLocation();
   const { data: hasConsent } = useSuspenseQuery(
      trpc.session.getTelemetryConsent.queryOptions(undefined, {
         meta: { skipGlobalInvalidation: true },
      }),
   );

   return (
      <PostHogWrapper env={clientEnv} hasConsent={hasConsent}>
         <PosthogRouterTracker location={location} />
         {children}
      </PostHogWrapper>
   );
}

function RootComponent() {
   return (
      <>
         <HeadContent />
         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryProvider>
               <TelemetryAwarePostHogWrapper>
                  <GlobalAlertDialog />
                  <GlobalCredenza />
                  <GlobalSheet />
                  <Toaster />
                  <Outlet />
                  <TanStackRouterDevtools position="bottom-left" />
               </TelemetryAwarePostHogWrapper>
            </QueryProvider>
         </ThemeProvider>
      </>
   );
}

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { CookieConsentBanner } from "@/features/cookie-consent/cookie-consent-banner";
import { getQueryClient, trpc } from "@/integrations/clients";
import { DashboardLayout } from "@/layout/dashboard-layout";

export const Route = createFileRoute("/$slug/_dashboard")({
   beforeLoad: async ({ location, params }) => {
      const queryClient = getQueryClient();
      try {
         const session = await queryClient.fetchQuery(
            trpc.session.getSession.queryOptions(),
         );

         if (!session) {
            throw redirect({
               replace: true,
               search: location.search,
               to: "/auth/sign-in",
            });
         }

         const isOnboardingPage = location.pathname.endsWith("/onboarding");
         if (isOnboardingPage) {
            return;
         }

         const status = await queryClient.fetchQuery({
            ...trpc.onboarding.getOnboardingStatus.queryOptions(),
            staleTime: 0,
         });

         if (status.needsOnboarding) {
            throw redirect({
               params,
               to: "/$slug/onboarding",
            });
         }
      } catch (error) {
         if (
            error instanceof Response ||
            (typeof error === "object" &&
               error !== null &&
               "isRedirect" in error)
         ) {
            throw error;
         }

         throw redirect({ to: "/auth/sign-in" });
      }
   },
   component: RouteComponent,
   wrapInSuspense: true,
});

function RouteComponent() {
   return (
      <DashboardLayout>
         <CookieConsentBanner />
         <div className="h-full w-full [view-transition-name:main-content]">
            <Outlet />
         </div>
      </DashboardLayout>
   );
}

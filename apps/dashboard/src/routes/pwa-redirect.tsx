import { createFileRoute, redirect } from "@tanstack/react-router";
import { getQueryClient, trpc } from "@/integrations/clients";

const ACTION_ROUTES: Record<string, string> = {
   "bank-accounts": "/bank-accounts",
   home: "/home",
   "new-transaction": "/transactions?openNewTransaction=true",
   reports: "/reports",
   transactions: "/transactions",
};

export const Route = createFileRoute("/pwa-redirect")({
   beforeLoad: async ({ search }) => {
      const queryClient = getQueryClient();

      try {
         const organizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         if (!organizations.length) {
            throw redirect({ to: "/auth/sign-in" });
         }

         const lastSlug = localStorage.getItem("montte:last-organization-slug");
         const org = lastSlug
            ? organizations.find((o) => o.slug === lastSlug) || organizations[0]
            : organizations[0];

         if (!org) {
            throw redirect({ to: "/auth/sign-in" });
         }

         const targetPath = ACTION_ROUTES[search.action] || ACTION_ROUTES.home;
         const fullPath = `/${org.slug}${targetPath}`;

         throw redirect({ href: fullPath });
      } catch (error) {
         if (
            error instanceof Response ||
            (error as { isRedirect?: boolean })?.isRedirect
         ) {
            throw error;
         }
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   component: () => null,
   validateSearch: (search: Record<string, unknown>) => ({
      action: (search.action as string) || "home",
   }),
});

import { createFileRoute, redirect } from "@tanstack/react-router";
import { getQueryClient, trpc } from "@/integrations/clients";

import { MagicLinkPage } from "@/pages/magic-link/ui/magic-link-page";

export const Route = createFileRoute("/auth/magic-link")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();
      const session = await queryClient
         .fetchQuery(trpc.session.getSession.queryOptions())
         .catch(() => null);
      if (session) {
         throw redirect({ params: { slug: "" }, to: "/$slug/home" });
      }
   },
   component: RouteComponent,
});

function RouteComponent() {
   return <MagicLinkPage />;
}

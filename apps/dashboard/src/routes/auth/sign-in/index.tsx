import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getQueryClient, trpc } from "@/integrations/clients";
import { SignInPage } from "@/pages/sign-in/ui/sign-in-page";

const signInSearchSchema = z.object({
   redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/sign-in/")({
   validateSearch: signInSearchSchema,
   beforeLoad: async ({ search }) => {
      const queryClient = getQueryClient();
      const session = await queryClient
         .fetchQuery(trpc.session.getSession.queryOptions())
         .catch(() => null);
      if (session) {
         // If there's a redirect URL, use it; otherwise go to home
         if (search.redirect) {
            throw redirect({ to: search.redirect });
         }
         throw redirect({ params: { slug: "" }, to: "/$slug/home" });
      }
   },
   component: RouteComponent,
});

function RouteComponent() {
   const { redirect: redirectUrl } = Route.useSearch();
   return <SignInPage redirectUrl={redirectUrl} />;
}

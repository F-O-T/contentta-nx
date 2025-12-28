import { Spinner } from "@packages/ui/components/spinner";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient, getQueryClient, trpc } from "@/integrations/clients";

export const Route = createFileRoute(
   "/callback/organization/invitation/$invitationId",
)({
   beforeLoad: async ({ params }) => {
      const queryClient = getQueryClient();
      const session = await queryClient
         .fetchQuery(trpc.session.getSession.queryOptions())
         .catch(() => null);

      // If user is not authenticated, redirect to sign-in with return URL
      if (!session) {
         const returnUrl = `/callback/organization/invitation/${params.invitationId}`;
         throw redirect({
            to: "/auth/sign-in",
            search: { redirect: returnUrl },
         });
      }

      return { invitationId: params.invitationId };
   },
   component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
   const { invitationId } = Route.useParams();
   const navigate = useNavigate();
   const [status, setStatus] = useState<"loading" | "success" | "error">(
      "loading",
   );
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      async function acceptInvitation() {
         try {
            const result = await betterAuthClient.organization.acceptInvitation(
               {
                  invitationId,
               },
            );

            if (result.error) {
               throw new Error(result.error.message);
            }

            setStatus("success");
            toast.success("Convite aceito com sucesso!");

            // Get the organization info and redirect
            const orgResult =
               await betterAuthClient.organization.getFullOrganization({
                  query: {
                     organizationId: result.data?.member?.organizationId,
                  },
               });

            if (orgResult.data?.slug) {
               // Redirect to the organization home
               navigate({
                  to: "/$slug/home",
                  params: { slug: orgResult.data.slug },
                  replace: true,
               });
            } else {
               // Fallback to auth sign-in if we can't get the org slug
               navigate({ to: "/auth/sign-in", replace: true });
            }
         } catch (error) {
            setStatus("error");
            const message =
               error instanceof Error
                  ? error.message
                  : "Falha ao aceitar o convite. Tente novamente.";
            setErrorMessage(message);
            toast.error(message);
         }
      }

      acceptInvitation();
   }, [invitationId, navigate]);

   return (
      <div className="flex min-h-screen items-center justify-center bg-background">
         <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
            {status === "loading" && (
               <>
                  <Spinner className="mx-auto mb-4 size-8" />
                  <h1 className="text-xl font-semibold text-foreground">
                     Aceitando convite...
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                     Aguarde enquanto processamos seu convite.
                  </p>
               </>
            )}

            {status === "success" && (
               <>
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
                     <svg
                        aria-hidden="true"
                        className="size-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           d="M5 13l4 4L19 7"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                        />
                     </svg>
                  </div>
                  <h1 className="text-xl font-semibold text-foreground">
                     Convite aceito!
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                     Redirecionando para a organização...
                  </p>
               </>
            )}

            {status === "error" && (
               <>
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
                     <svg
                        aria-hidden="true"
                        className="size-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           d="M6 18L18 6M6 6l12 12"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                        />
                     </svg>
                  </div>
                  <h1 className="text-xl font-semibold text-foreground">
                     Erro ao aceitar convite
                  </h1>
                  <p className="mt-2 text-muted-foreground">{errorMessage}</p>
                  <button
                     className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                     onClick={() =>
                        navigate({ to: "/auth/sign-in", replace: true })
                     }
                     type="button"
                  >
                     Ir para o início
                  </button>
               </>
            )}
         </div>
      </div>
   );
}

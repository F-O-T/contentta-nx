import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { EmailVerificationPage } from "@/pages/email-verification/ui/email-verification-page";

const searchParams = z.object({
   email: z.email(),
});
export const Route = createFileRoute("/auth/email-verification")({
   validateSearch: searchParams,
   component: RouteComponent,
   ssr: true,
   validateSearch: (search) => searchParams.parse(search),
   wrapInSuspense: true,
});

function RouteComponent() {
   return <EmailVerificationPage />;
}

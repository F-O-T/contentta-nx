import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { EmailVerificationPage } from "@/pages/email-verification/ui/email-verification-page";

const searchParams = z.object({
   email: z.email(),
});
export const Route = createFileRoute("/auth/email-verification")({
   component: RouteComponent,
   validateSearch: searchParams,
});

function RouteComponent() {
   return <EmailVerificationPage />;
}

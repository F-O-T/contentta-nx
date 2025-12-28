import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
   CheckCircle2Icon,
   ChevronRightIcon,
   Loader2Icon,
   SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

export const Route = createFileRoute("/$slug/onboarding")({
   component: RouteComponent,
});

function RouteComponent() {
   const trpc = useTRPC();
   const navigate = useNavigate({ from: "/$slug/onboarding" });
   const { slug } = Route.useParams();

   const { data: session } = useQuery(trpc.session.getSession.queryOptions());

   const completeOnboarding = useMutation(
      trpc.onboarding.completeOnboarding.mutationOptions({
         onError: () => {
            toast.error(translate("common.errors.default"));
         },
         onSuccess: () => {
            navigate({ params: { slug }, to: "/$slug/home" });
         },
      }),
   );

   const handleComplete = async () => {
      await completeOnboarding.mutateAsync();
   };

   const userName = session?.user?.name || "";

   return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
         <div className="w-full max-w-md space-y-8 text-center">
            <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit">
               <SparklesIcon className="size-12 text-primary" />
            </div>

            <div className="space-y-2">
               <h1 className="text-3xl font-semibold font-serif">
                  {translate("dashboard.routes.onboarding.welcome.title")}
               </h1>
               <p className="text-muted-foreground">
                  {translate("dashboard.routes.onboarding.welcome.description")}
               </p>
            </div>

            <div className="p-6 rounded-lg border bg-card space-y-4">
               <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="size-5 text-green-500" />
                  <span>{userName}</span>
               </div>
            </div>

            <Button
               className="w-full gap-2"
               disabled={completeOnboarding.isPending}
               onClick={handleComplete}
               size="lg"
            >
               {completeOnboarding.isPending ? (
                  <>
                     <Loader2Icon className="size-4 animate-spin" />
                     {translate("common.actions.loading")}
                  </>
               ) : (
                  <>
                     {translate("common.actions.continue")}
                     <ChevronRightIcon className="size-4" />
                  </>
               )}
            </Button>
         </div>
      </div>
   );
}

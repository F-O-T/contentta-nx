import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Link } from "@tanstack/react-router";
import { Crown, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

interface UpgradeRequiredProps {
   children: ReactNode;
   featureName: string;
   hasAccess: boolean;
   requiredPlan?: "basic" | "erp";
}

export function UpgradeRequired({
   children,
   featureName,
   hasAccess,
   requiredPlan = "erp",
}: UpgradeRequiredProps) {
   const { activeOrganization } = useActiveOrganization();

   if (hasAccess) {
      return <>{children}</>;
   }

   const planDisplayName = requiredPlan === "erp" ? "ERP" : "Basic";

   return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
         <Card className="max-w-md w-full text-center">
            <CardHeader className="pb-4">
               <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                  <Lock className="size-8 text-muted-foreground" />
               </div>
               <CardTitle className="text-xl">Recurso não disponível</CardTitle>
               <CardDescription className="text-base">
                  <strong>{featureName}</strong> requer o plano{" "}
                  <strong>{planDisplayName}</strong> ou superior.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground">
                  Faça upgrade do seu plano para desbloquear este recurso e
                  aproveitar todos os benefícios.
               </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
               <Button asChild className="w-full gap-2">
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     search={{ success: undefined }}
                     to="/$slug/plans"
                  >
                     <Crown className="size-4" />
                     Ver planos
                  </Link>
               </Button>
               <Button asChild className="w-full" variant="ghost">
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     to="/$slug/home"
                  >
                     Voltar ao início
                  </Link>
               </Button>
            </CardFooter>
         </Card>
      </div>
   );
}

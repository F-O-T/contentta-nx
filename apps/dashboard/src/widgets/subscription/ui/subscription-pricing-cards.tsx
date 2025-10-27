import { betterAuthClient } from "@/integrations/clients";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardHeader,
   CardDescription,
   CardTitle,
   CardContent,
   CardFooter,
} from "@packages/ui/components/card";
import { Separator } from "@packages/ui/components/separator";
import { useCallback, useMemo } from "react";

export function SubscriptionPricingCards() {
   const plans = useMemo(
      () => [
         {
            slug: "basic",
            name: "Basic",
            price: "$8 / mo",
            buttonVariant: "default" as const,
            features: ["$5 of credits", "Pay as you go after"],
         },
         {
            slug: "hobby",
            name: "Hobby",
            price: "$0 / mo",
            buttonVariant: "outline" as const,
            features: [
               "$1 of credits",
               "Dont include additional usage",
               "No credit card required",
            ],
         },
      ],
      [],
   );

   const handleCheckout = useCallback(async (slug: string) => {
      return await betterAuthClient.checkout({
         slug,
      });
   }, []);

   return (
      <>
         {plans.map((plan) => (
            <Card key={plan.slug}>
               <CardHeader>
                  <CardDescription>{plan.name}</CardDescription>
                  <CardTitle>{plan.price}</CardTitle>
               </CardHeader>
               <CardContent>
                  <Button
                     onClick={() => handleCheckout(plan.slug)}
                     variant={plan.buttonVariant}
                     className="w-full"
                  >
                     Get Started
                  </Button>
               </CardContent>
               <CardFooter className="grid gap-4">
                  <Separator />
                  <ul className="list-disc list-inside space-y-1 text-sm">
                     {plan.features.map((feature, index) => (
                        <li key={`subscription-benefits-${index + 1}`}>
                           {feature}
                        </li>
                     ))}
                  </ul>
               </CardFooter>
            </Card>
         ))}
      </>
   );
}

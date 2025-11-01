import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaTrigger,
} from "@packages/ui/components/credenza";
import { Separator } from "@packages/ui/components/separator";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { useCallback } from "react";
import { betterAuthClient } from "@/integrations/clients";

interface SubscriptionPlanCardProps {
   name: string;
   price: string;
   features: string[];
   slug: string;
}

function SubscriptionPlanCard({
   name,
   price,
   features,
   slug,
}: SubscriptionPlanCardProps) {
   const handleCheckout = useCallback(async (planSlug: string) => {
      return await betterAuthClient.checkout({
         slug: planSlug,
      });
   }, []);

   return (
      <Card>
         <CardHeader>
            <CardDescription>{name}</CardDescription>
            <CardTitle>{price}</CardTitle>
         </CardHeader>
         <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
               {features.map((feature, index) => (
                  <li key={`subscription-benefits-${index + 1}`}>{feature}</li>
               ))}
            </ul>
         </CardContent>
         <CardFooter className="grid gap-4">
            <Separator />
            <Button className="w-full" onClick={() => handleCheckout(slug)}>
               Get Started
            </Button>
         </CardFooter>
      </Card>
   );
}

interface SubscriptionPlansCredenzaProps {
   children: React.ReactNode;
}

export function SubscriptionPlansCredenza({
   children,
}: SubscriptionPlansCredenzaProps) {
   return (
      <Credenza>
         <CredenzaTrigger asChild>{children}</CredenzaTrigger>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Choose Your Plan</CredenzaTitle>
               <CredenzaDescription>
                  Select the perfect plan for your needs
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
               <Tabs className="w-full" defaultValue="basic">
                  <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="hobby">Hobby</TabsTrigger>
                     <TabsTrigger value="basic">Basic</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic">
                     <SubscriptionPlanCard
                        features={[
                           "$5 of credits",
                           "7 days free trial",
                           "Pay as you go after",
                        ]}
                        name="Basic"
                        price="$8 / mo"
                        slug="basic"
                     />
                  </TabsContent>
                  <TabsContent value="hobby">
                     <SubscriptionPlanCard
                        features={[
                           "$1 of credits",
                           "Dont include additional usage",
                           "No credit card required",
                        ]}
                        name="Hobby"
                        price="$0 / mo"
                        slug="hobby"
                     />
                  </TabsContent>
               </Tabs>
            </CredenzaBody>
            <CredenzaFooter className="text-sm flex sm:justify-start items-center gap-1">
               <span>Compare plans and options on our</span>
               <a
                  className="text-primary underline"
                  href="https://contentagen.com/#pricing"
                  rel="noreferrer"
                  target="_blank"
               >
                  pricing page.
               </a>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}

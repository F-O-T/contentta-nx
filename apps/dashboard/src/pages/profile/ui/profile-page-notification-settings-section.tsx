import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { DollarSign } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { CurrencyCommand } from "@/pages/profile/features/currency-command";

function AccountConfigurationErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.profile.account-configuration.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.profile.account-configuration.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.account-configuration.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.account-configuration.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function AccountConfigurationSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Item className="p-0">
               <ItemMedia variant="icon">
                  <Skeleton className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     <Skeleton className="h-5 w-1/2" />
                  </ItemTitle>
                  <ItemDescription>
                     <Skeleton className="h-4 w-3/4" />
                  </ItemDescription>
               </ItemContent>
            </Item>
         </CardContent>
      </Card>
   );
}

function AccountConfigurationContent() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate(
                  "dashboard.routes.profile.account-configuration.title",
               )}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.profile.account-configuration.description",
               )}
            </CardDescription>
         </CardHeader>

         <CardContent>
            <Item>
               <ItemMedia variant="icon">
                  <DollarSign className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate(
                        "dashboard.routes.profile.account-configuration.items.currency.title",
                     )}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "dashboard.routes.profile.account-configuration.items.currency.description",
                     )}
                  </ItemDescription>
               </ItemContent>
               <CurrencyCommand />
            </Item>
         </CardContent>
      </Card>
   );
}

export function AccountConfigurationSection() {
   return (
      <ErrorBoundary FallbackComponent={AccountConfigurationErrorFallback}>
         <Suspense fallback={<AccountConfigurationSkeleton />}>
            <AccountConfigurationContent />
         </Suspense>
      </ErrorBoundary>
   );
}

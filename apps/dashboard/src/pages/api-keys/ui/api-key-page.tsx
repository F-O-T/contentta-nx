import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useSheet } from "@/hooks/use-sheet";
import { ApiKeyList } from "./api-key-list";
import { CreateApiKeyForm } from "./create-api-key-form";
import { EditApiKeyForm } from "./edit-api-key-form";

function ApiKeyPageErrorFallback(props: FallbackProps) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Chaves de API</CardTitle>
            <CardDescription>
               Gerencie suas chaves de API para integrações externas
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Algo deu errado ao carregar suas chaves de API. Por favor, tente novamente.",
               errorTitle: "Falha ao carregar chaves de API",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

function ApiKeyPageSkeleton() {
   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1.5">
               <Skeleton className="h-6 w-24" />
               <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
         </CardHeader>
         <CardContent>
            <div className="space-y-1">
               {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                     className="h-16 w-full rounded-lg"
                     key={`skeleton-${i + 1}`}
                  />
               ))}
            </div>
         </CardContent>
      </Card>
   );
}

function ApiKeyPageContent() {
   const { openSheet } = useSheet();

   const handleCreateKey = () => {
      openSheet({
         children: <CreateApiKeyForm />,
      });
   };

   const handleEditKey = (key: { id: string; name: string | null }) => {
      openSheet({
         children: <EditApiKeyForm keyId={key.id} currentName={key.name} />,
      });
   };

   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1.5">
               <CardTitle>Chaves de API</CardTitle>
               <CardDescription>
                  Gerencie suas chaves de API para integrações externas
               </CardDescription>
            </div>
            <Button onClick={handleCreateKey} size="sm">
               <Plus className="size-4 mr-2" />
               Criar Chave de API
            </Button>
         </CardHeader>
         <CardContent>
            <ApiKeyList onEdit={handleEditKey} />
         </CardContent>
      </Card>
   );
}

export function ApiKeyPage() {
   return (
      <div className="flex flex-col gap-4">
         <ErrorBoundary FallbackComponent={ApiKeyPageErrorFallback}>
            <Suspense fallback={<ApiKeyPageSkeleton />}>
               <ApiKeyPageContent />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}

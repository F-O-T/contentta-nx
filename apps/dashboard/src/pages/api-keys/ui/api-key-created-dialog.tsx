import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { createElement, useState } from "react";
import { toast } from "sonner";
import { closeCredenza, openCredenza } from "@/hooks/use-credenza";

interface ApiKeyCreatedDialogProps {
   apiKey: string;
   keyName?: string | null;
}

function ApiKeyCreatedDialogContent({
   apiKey,
   keyName,
}: ApiKeyCreatedDialogProps) {
   const [copied, setCopied] = useState(false);

   const handleCopy = async () => {
      try {
         await navigator.clipboard.writeText(apiKey);
         setCopied(true);
         toast.success("Chave de API copiada para a área de transferência");
         setTimeout(() => setCopied(false), 2000);
      } catch {
         toast.error("Falha ao copiar para a área de transferência");
      }
   };

   const handleDone = () => {
      if (!copied) {
         const confirmClose = window.confirm(
            "Tem certeza? Você ainda não copiou a chave de API. Você não poderá vê-la novamente.",
         );
         if (!confirmClose) return;
      }
      closeCredenza();
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {keyName ? `"${keyName}" Criada` : "Chave de API Criada"}
            </CredenzaTitle>
            <CredenzaDescription>
               Sua chave de API foi criada com sucesso
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertDescription>
                  Certifique-se de copiar sua chave de API agora. Você não
                  poderá vê-la novamente!
               </AlertDescription>
            </Alert>

            <div className="relative">
               <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                  <code className="flex-1 text-sm font-mono break-all select-all">
                     {apiKey}
                  </code>
                  <Button
                     className="shrink-0"
                     onClick={handleCopy}
                     size="icon"
                     variant="ghost"
                  >
                     {copied ? (
                        <Check className="size-4 text-green-500" />
                     ) : (
                        <Copy className="size-4" />
                     )}
                  </Button>
               </div>
            </div>
         </CredenzaBody>

         <CredenzaFooter>
            <Button className="w-full" onClick={handleDone} variant="default">
               {copied ? "Concluído" : "Já copiei a chave"}
            </Button>
         </CredenzaFooter>
      </>
   );
}

export function openApiKeyCreatedDialog(
   apiKey: string,
   keyName?: string | null,
) {
   openCredenza({
      children: createElement(ApiKeyCreatedDialogContent, { apiKey, keyName }),
   });
}

export function ApiKeyCreatedDialog() {
   return null;
}

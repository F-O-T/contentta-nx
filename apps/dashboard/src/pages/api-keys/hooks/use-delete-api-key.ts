import { useCallback } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { betterAuthClient } from "@/integrations/clients";
import { invalidateApiKeys } from "../ui/api-key-list";

export function useDeleteApiKey() {
   const { openAlertDialog } = useAlertDialog();

   const deleteApiKey = useCallback(
      (keyId: string, keyName: string) => {
         openAlertDialog({
            title: "Excluir Chave de API",
            description: `Tem certeza que deseja excluir "${keyName}"? Esta ação não pode ser desfeita e qualquer aplicação usando esta chave deixará de funcionar.`,
            actionLabel: "Excluir",
            cancelLabel: "Cancelar",
            variant: "destructive",
            onAction: async () => {
               await betterAuthClient.apiKey.delete(
                  { keyId },
                  {
                     onRequest: () => {
                        toast.loading("Excluindo chave de API...", {
                           id: "delete-api-key",
                        });
                     },
                     onSuccess: () => {
                        toast.success("Chave de API excluída com sucesso", {
                           id: "delete-api-key",
                        });
                        invalidateApiKeys();
                     },
                     onError: (ctx) => {
                        toast.error(
                           ctx.error.message || "Falha ao excluir chave de API",
                           { id: "delete-api-key" },
                        );
                     },
                  },
               );
            },
         });
      },
      [openAlertDialog],
   );

   return { deleteApiKey };
}

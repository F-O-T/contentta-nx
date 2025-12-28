import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Key, Pencil, Trash2 } from "lucide-react";
import { Fragment } from "react";
import { betterAuthClient, getQueryClient } from "@/integrations/clients";
import { useDeleteApiKey } from "../hooks/use-delete-api-key";

function formatRelativeTime(date: Date | string): string {
   const d = new Date(date);
   const now = new Date();
   const diff = now.getTime() - d.getTime();
   const minutes = Math.floor(diff / 60000);
   const hours = Math.floor(diff / 3600000);
   const days = Math.floor(diff / 86400000);

   if (minutes < 1) return "Agora";
   if (minutes < 60) return `${minutes}min atrás`;
   if (hours < 24) return `${hours}h atrás`;
   if (days < 7) return `${days}d atrás`;
   return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
   });
}

function formatExpirationDate(date: Date | string | null): string | null {
   if (!date) return null;
   const d = new Date(date);
   const now = new Date();

   if (d < now) return "Expirada";

   const diff = d.getTime() - now.getTime();
   const days = Math.floor(diff / 86400000);

   if (days < 1) return "Expira hoje";
   if (days === 1) return "Expira amanhã";
   if (days < 7) return `Expira em ${days} dias`;
   if (days < 30) return `Expira em ${Math.floor(days / 7)} semanas`;
   return `Expira em ${d.toLocaleDateString("pt-BR", { month: "short", day: "2-digit" })}`;
}

export const apiKeysQueryOptions = queryOptions({
   queryKey: ["api-keys"],
   queryFn: async () => {
      const result = await betterAuthClient.apiKey.list();
      if (result.error) {
         throw new Error(result.error.message || "Falha ao buscar chaves de API");
      }
      return result.data ?? [];
   },
});

export function invalidateApiKeys() {
   return getQueryClient().invalidateQueries({ queryKey: ["api-keys"] });
}

interface ApiKeyListProps {
   onEdit: (key: { id: string; name: string | null }) => void;
}

export function ApiKeyList({ onEdit }: ApiKeyListProps) {
   const { data: keys } = useSuspenseQuery(apiKeysQueryOptions);
   const { deleteApiKey } = useDeleteApiKey();

   if (keys.length === 0) {
      return (
         <Empty className="border-none py-8">
            <EmptyHeader>
               <EmptyMedia variant="icon">
                  <Key className="size-6" />
               </EmptyMedia>
               <EmptyTitle>Nenhuma chave de API</EmptyTitle>
               <EmptyDescription>
                  Crie uma chave de API para autenticar aplicações e serviços
                  externos.
               </EmptyDescription>
            </EmptyHeader>
         </Empty>
      );
   }

   return (
      <TooltipProvider>
         <ItemGroup>
            {keys.map((key, index) => {
               const expirationText = formatExpirationDate(key.expiresAt);
               const isExpired = expirationText === "Expirada";
               const keyDisplay = key.prefix
                  ? `${key.prefix}_${key.start}...`
                  : `${key.start}...`;

               return (
                  <Fragment key={key.id}>
                     <Item variant="muted">
                        <ItemMedia variant="icon">
                           <Key className="size-4" />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                           <div className="flex items-center gap-2 flex-wrap">
                              <ItemTitle className="truncate">
                                 {key.name || "Chave sem nome"}
                              </ItemTitle>
                              {isExpired && (
                                 <Badge variant="destructive">Expirada</Badge>
                              )}
                              {!key.enabled && !isExpired && (
                                 <Badge variant="secondary">Desativada</Badge>
                              )}
                           </div>
                           <ItemDescription className="flex items-center gap-2 flex-wrap">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                 {keyDisplay}
                              </code>
                              <span className="text-muted-foreground/50">
                                 •
                              </span>
                              <span>
                                 Criada {formatRelativeTime(key.createdAt)}
                              </span>
                              {expirationText && !isExpired && (
                                 <>
                                    <span className="text-muted-foreground/50">
                                       •
                                    </span>
                                    <span>{expirationText}</span>
                                 </>
                              )}
                              {!expirationText && (
                                 <>
                                    <span className="text-muted-foreground/50">
                                       •
                                    </span>
                                    <span>Nunca expira</span>
                                 </>
                              )}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button
                                    onClick={() =>
                                       onEdit({ id: key.id, name: key.name })
                                    }
                                    size="icon"
                                    variant="ghost"
                                 >
                                    <Pencil className="size-4" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar nome</TooltipContent>
                           </Tooltip>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button
                                    onClick={() =>
                                       deleteApiKey(
                                          key.id,
                                          key.name || "Chave sem nome",
                                       )
                                    }
                                    size="icon"
                                    variant="ghost"
                                 >
                                    <Trash2 className="size-4" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir</TooltipContent>
                           </Tooltip>
                        </ItemActions>
                     </Item>
                     {index !== keys.length - 1 && <ItemSeparator />}
                  </Fragment>
               );
            })}
         </ItemGroup>
      </TooltipProvider>
   );
}

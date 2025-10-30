import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@packages/ui/components/sheet";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { CheckCircle2, Monitor, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { betterAuthClient } from "@/integrations/clients";
import { type Session } from "@/integrations/clients";

interface SessionDetailsSheetProps {
   session: Session["session"];
   currentSessionId: string | null;
   children: React.ReactNode;
}

export function SessionDetailsSheet({
   session,
   currentSessionId,
   children,
}: SessionDetailsSheetProps) {
   const queryClient = useQueryClient();

   const revokeSessionMutation = useMutation({
      mutationFn: async (token: string) => {
         await betterAuthClient.revokeSession({ token });
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
   });

   const handleDelete = useCallback(
      (token: string) => {
         if (
            !window.confirm(translate("pages.profile.sessions.revoke-confirm"))
         )
            return;
         revokeSessionMutation.mutate(token);
      },
      [revokeSessionMutation],
   );

   const sessionDetails = useMemo(() => {
      return [
         {
            title: "Device",
            value:
               session.userAgent ||
               translate("pages.profile.sessions.unknown-device"),
            showIcon: false,
            isCurrent: session.id === currentSessionId,
         },
         {
            title: translate("pages.profile.sessions.ip-address"),
            value: session.ipAddress || "-",
            showIcon: false,
            isCurrent: false,
         },
         {
            title: translate("pages.profile.sessions.created"),
            value: session.createdAt
               ? new Date(session.createdAt).toLocaleString()
               : "-",
            showIcon: false,
            isCurrent: false,
         },
         {
            title: translate("pages.profile.sessions.last-active"),
            value: session.updatedAt
               ? new Date(session.updatedAt).toLocaleString()
               : "-",
            showIcon: false,
            isCurrent: false,
         },
      ];
   }, [session, currentSessionId]);

   return (
      <Sheet>
         <SheetTrigger asChild>{children}</SheetTrigger>
         <SheetContent>
            <SheetHeader>
               <SheetTitle>Your Session</SheetTitle>
               <SheetDescription>
                  Here are the details of your session
               </SheetDescription>
            </SheetHeader>
            <div className="p-2 space-y-2">
               <ItemGroup>
                  {sessionDetails.map((detail, index) => (
                     <Item key={detail.title}>
                        {detail.showIcon && (
                           <ItemMedia variant="icon">
                              <Monitor className="size-4" />
                           </ItemMedia>
                        )}
                        <ItemContent>
                           <ItemTitle>
                              {detail.title}
                              {detail.isCurrent && (
                                 <span className="text-primary flex items-center gap-1 text-xs font-semibold">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {translate(
                                       "pages.profile.sessions.current",
                                    )}
                                 </span>
                              )}
                           </ItemTitle>
                           <ItemDescription>{detail.value}</ItemDescription>
                        </ItemContent>
                        {index < sessionDetails.length - 1 && <ItemSeparator />}
                     </Item>
                  ))}
               </ItemGroup>
               <div className="border-t pt-4">
                  <div className="flex flex-col gap-4 items-center justify-between">
                     <h4 className="font-medium text-sm text-start">
                        {translate("pages.profile.sessions.session-actions")}
                     </h4>
                     <TooltipProvider>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 aria-label={translate(
                                    "pages.profile.sessions.revoke-session",
                                 )}
                                 disabled={revokeSessionMutation.isPending}
                                 onClick={() =>
                                    handleDelete(session.token || session.id)
                                 }
                                 size="icon"
                                 variant="destructive"
                              >
                                 {revokeSessionMutation.isPending ? (
                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                 ) : (
                                    <Trash2 className="w-4 h-4" />
                                 )}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                              <p>
                                 {revokeSessionMutation.isPending
                                    ? translate(
                                         "pages.profile.sessions.revoke-session-loading",
                                      )
                                    : translate(
                                         "pages.profile.sessions.revoke-session",
                                      )}
                              </p>
                           </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </div>
               </div>
            </div>
         </SheetContent>
      </Sheet>
   );
}

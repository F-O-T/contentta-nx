import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
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
import { Separator } from "@packages/ui/components/separator";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@packages/ui/components/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Monitor, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { betterAuthClient, type Session } from "@/integrations/clients";

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
            isCurrent: session.id === currentSessionId,
            showIcon: false,
            title: "Device",
            value:
               session.userAgent ||
               translate("pages.profile.sessions.unknown-device"),
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate("pages.profile.sessions.ip-address"),
            value: session.ipAddress || "-",
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate("pages.profile.sessions.created"),
            value: session.createdAt
               ? new Date(session.createdAt).toLocaleString()
               : "-",
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate("pages.profile.sessions.last-active"),
            value: session.updatedAt
               ? new Date(session.updatedAt).toLocaleString()
               : "-",
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
                                 {translate("pages.profile.sessions.current")}
                              </span>
                           )}
                        </ItemTitle>
                        <ItemDescription>{detail.value}</ItemDescription>
                     </ItemContent>
                     {index < sessionDetails.length - 1 && <ItemSeparator />}
                  </Item>
               ))}
            </ItemGroup>
            <Separator />
            <SheetHeader>
               <SheetTitle>Actions</SheetTitle>
               <SheetDescription>
                  Here you find the actions for this session
               </SheetDescription>
            </SheetHeader>
            <ItemGroup>
               <Item>
                  <ItemMedia variant="icon">
                     <Trash2 className="w-4 h-4 text-destructive" />
                  </ItemMedia>
                  <ItemContent className="gap-1">
                     <ItemTitle className="text-destructive">
                        {translate("pages.profile.sessions.revoke-session")}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "pages.profile.sessions.revoke-session-description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Button
                        aria-label={translate(
                           "pages.profile.sessions.revoke-session",
                        )}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                        disabled={revokeSessionMutation.isPending}
                        onClick={() =>
                           handleDelete(session.token || session.id)
                        }
                        size="icon"
                        variant="ghost"
                     >
                        {revokeSessionMutation.isPending ? (
                           <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                           <Trash2 className="w-4 h-4" />
                        )}
                     </Button>
                  </ItemActions>
               </Item>
            </ItemGroup>
         </SheetContent>
      </Sheet>
   );
}

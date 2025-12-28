import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Separator } from "@packages/ui/components/separator";
import {
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { toast } from "@packages/ui/components/sonner";
import { formatDate } from "@packages/utils/date";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Monitor, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import type { Session } from "@/integrations/clients";
import { useTRPC } from "@/integrations/clients";

interface SessionDetailsFormProps {
   session: Session["session"];
   currentSessionId: string | null;
}

export function SessionDetailsForm({
   session,
   currentSessionId,
}: SessionDetailsFormProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const { openAlertDialog } = useAlertDialog();

   const revokeSessionMutation = useMutation(
      trpc.session.revokeSessionByToken.mutationOptions({
         onSuccess: () => {
            toast.success("Session revoked");
            closeSheet();
         },
      }),
   );

   const handleDelete = useCallback(async () => {
      await revokeSessionMutation.mutateAsync({
         token: session.token,
      });
   }, [session, revokeSessionMutation]);

   const handleRevokeClick = useCallback(() => {
      openAlertDialog({
         actionLabel: translate(
            "dashboard.routes.profile.features.session-details.actions.revoke-current.title",
         ),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "common.headers.delete-confirmation.description",
         ),
         onAction: handleDelete,
         title: translate("common.headers.delete-confirmation.title"),
         variant: "destructive",
      });
   }, [openAlertDialog, handleDelete]);

   const sessionDetails = useMemo(() => {
      return [
         {
            isCurrent: session.id === currentSessionId,
            showIcon: false,
            title: translate("dashboard.routes.profile.sessions.item.device"),
            value:
               session.userAgent ||
               translate(
                  "dashboard.routes.profile.sessions.item.unknown-device",
               ),
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate(
               "dashboard.routes.profile.sessions.item.ip-address",
            ),
            value: session.ipAddress || "-",
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate(
               "dashboard.routes.profile.sessions.item.created-at",
            ),
            value: formatDate(session.createdAt),
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate(
               "dashboard.routes.profile.sessions.item.last-active",
            ),
            value: formatDate(session.updatedAt),
         },
      ];
   }, [session, currentSessionId]);

   return (
      <>
         <SheetHeader>
            <SheetTitle>
               {translate(
                  "dashboard.routes.profile.features.session-details.title",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  "dashboard.routes.profile.features.session-details.description",
               )}
            </SheetDescription>
         </SheetHeader>
         <ItemGroup>
            {sessionDetails.map((detail) => (
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
                           <Badge>
                              <CheckCircle2 className="w-4 h-4" />
                              {translate(
                                 "dashboard.routes.profile.sessions.item.current",
                              )}
                           </Badge>
                        )}
                     </ItemTitle>
                     <ItemDescription>{detail.value}</ItemDescription>
                  </ItemContent>
               </Item>
            ))}
         </ItemGroup>
         <Separator />
         <SheetHeader>
            <SheetTitle>
               {translate(
                  "dashboard.routes.profile.features.session-details.actions.title",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  "dashboard.routes.profile.features.session-details.actions.description",
               )}
            </SheetDescription>
         </SheetHeader>
         <ItemGroup className="px-4">
            <Item
               aria-label={translate(
                  "dashboard.routes.profile.features.session-details.actions.revoke-current.title",
               )}
               className="cursor-pointer"
               onClick={handleRevokeClick}
               variant="outline"
            >
               <ItemMedia variant="icon">
                  <Trash2 className="w-4 h-4 text-destructive" />
               </ItemMedia>
               <ItemContent className="gap-1">
                  <ItemTitle className="text-destructive">
                     {translate(
                        "dashboard.routes.profile.features.session-details.actions.revoke-current.title",
                     )}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "dashboard.routes.profile.features.session-details.actions.revoke-current.description",
                     )}
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <ArrowRight className="size-4 text-destructive" />
               </ItemActions>
            </Item>
         </ItemGroup>
      </>
   );
}

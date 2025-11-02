import { translate } from "@packages/localization";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@packages/ui/components/alert-dialog";
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
import { toast } from "@packages/ui/components/sonner";
import { formatDate } from "@packages/utils/date";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Monitor, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { Session } from "@/integrations/clients";
import { useTRPC } from "@/integrations/clients";

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
   const trpc = useTRPC();

   const revokeSessionMutation = useMutation(
      trpc.session.revokeSessionByToken.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.session.listAllSessions.queryKey(),
            });
            toast.success("Session revoked");
         },
      }),
   );

   const handleDelete = useCallback(async () => {
      await revokeSessionMutation.mutateAsync({
         token: session.token,
      });
   }, [session, revokeSessionMutation]);

   const sessionDetails = useMemo(() => {
      return [
         {
            isCurrent: session.id === currentSessionId,
            showIcon: false,
            title: "Device",
            value:
               session.userAgent ||
               translate("pages.profile.sessions.item.unknown-device"),
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate("pages.profile.sessions.item.ip-address"),
            value: session.ipAddress || "-",
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate("pages.profile.sessions.item.created-at"),
            value: formatDate(session.createdAt),
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate("pages.profile.sessions.item.last-active"),
            value: formatDate(session.updatedAt),
         },
      ];
   }, [session, currentSessionId]);

   return (
      <Sheet>
         <SheetTrigger asChild>{children}</SheetTrigger>
         <SheetContent>
            <SheetHeader>
               <SheetTitle>
                  {translate("pages.profile.features.session-details.title")}
               </SheetTitle>
               <SheetDescription>
                  {translate(
                     "pages.profile.features.session-details.description",
                  )}
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
                                 {translate(
                                    "pages.profile.sessions.item.current",
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
            <Separator />
            <SheetHeader>
               <SheetTitle>
                  {translate(
                     "pages.profile.features.session-details.actions.title",
                  )}
               </SheetTitle>
               <SheetDescription>
                  {translate(
                     "pages.profile.features.session-details.actions.description",
                  )}
               </SheetDescription>
            </SheetHeader>
            <ItemGroup className="px-4">
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Item
                        aria-label={translate(
                           "pages.profile.features.session-details.actions.revoke-current.title",
                        )}
                        className="cursor-pointer"
                        variant="outline"
                     >
                        <ItemMedia variant="icon">
                           <Trash2 className="w-4 h-4 text-destructive" />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <ItemTitle className="text-destructive">
                              {translate(
                                 "pages.profile.features.session-details.actions.revoke-current.title",
                              )}
                           </ItemTitle>
                           <ItemDescription>
                              {translate(
                                 "pages.profile.features.session-details.actions.revoke-current.description",
                              )}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ArrowRight className="size-4 text-destructive" />
                        </ItemActions>
                     </Item>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>
                           {translate("common.delete-confirmation.title")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                           {translate("common.delete-confirmation.description")}
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel>
                           {translate("common.actions.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                           {translate(
                              "pages.profile.features.session-details.actions.revoke-current.title",
                           )}
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </ItemGroup>
         </SheetContent>
      </Sheet>
   );
}

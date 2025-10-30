import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   CardAction,
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
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
import { TooltipProvider } from "@packages/ui/components/tooltip";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Info, Monitor, MoreVertical, Trash2 } from "lucide-react";
import { Fragment } from "react";
import { betterAuthClient } from "@/integrations/clients";
import { SessionDetailsSheet } from "../features/session-details-sheet";

export function ProfilePageSessionsSection() {
   const queryClient = useQueryClient();

   // Fetch sessions and current session in parallel
   const { data: sessions } = useSuspenseQuery({
      queryFn: async () => {
         const { data } = await betterAuthClient.listSessions();
         return data || [];
      },
      queryKey: ["sessions"],
   });
   const { data: currentSession } = useSuspenseQuery({
      queryFn: async () => {
         const { data } = await betterAuthClient.getSession();
         return data;
      },
      queryKey: ["currentSession"],
   });
   const currentSessionId = currentSession?.session.id || null;

   // Mutations
   const revokeOtherSessionsMutation = useMutation({
      mutationFn: async () => {
         await betterAuthClient.revokeOtherSessions();
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
   });
   const revokeAllSessionsMutation = useMutation({
      mutationFn: async () => {
         await betterAuthClient.revokeSessions();
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
   });

   return (
      <TooltipProvider>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.profile.sessions.sessions-title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.profile.sessions.sessions-description")}
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label={translate(
                              "pages.profile.sessions.manage-sessions",
                           )}
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel>
                           {translate("pages.profile.sessions.manage-sessions")}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem
                              disabled={revokeOtherSessionsMutation.isPending}
                              onSelect={(e) => {
                                 e.preventDefault();
                                 revokeOtherSessionsMutation.mutate();
                              }}
                           >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {revokeOtherSessionsMutation.isPending
                                 ? translate(
                                      "pages.profile.sessions.revoke-other-loading",
                                   )
                                 : translate(
                                      "pages.profile.sessions.revoke-other",
                                   )}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              disabled={revokeAllSessionsMutation.isPending}
                              onSelect={(e) => {
                                 e.preventDefault();
                                 revokeAllSessionsMutation.mutate();
                              }}
                              variant="destructive"
                           >
                              <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                              {revokeAllSessionsMutation.isPending
                                 ? translate(
                                      "pages.profile.sessions.revoke-all-loading",
                                   )
                                 : translate(
                                      "pages.profile.sessions.revoke-all-sessions",
                                   )}
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
               {sessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                     {translate("pages.profile.sessions.no-sessions")}
                  </div>
               ) : (
                  <ItemGroup>
                     {sessions.map((session, index) => (
                        <Fragment key={session.id}>
                           <Item>
                              <ItemMedia variant="icon">
                                 <Monitor className="size-4" />
                              </ItemMedia>
                              <ItemContent className="truncate">
                                 <ItemTitle>
                                    {session.userAgent ||
                                       translate(
                                          "pages.profile.sessions.unknown-device",
                                       )}
                                 </ItemTitle>
                                 <ItemDescription>
                                    {translate(
                                       "pages.profile.sessions.ip-address",
                                    )}{" "}
                                    {session.ipAddress || "-"}
                                 </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                 <SessionDetailsSheet
                                    currentSessionId={currentSessionId}
                                    session={session}
                                 >
                                    <Button
                                       aria-label={translate(
                                          "pages.profile.sessions.session-details",
                                       )}
                                       size="icon"
                                       variant="ghost"
                                    >
                                       <Info className="w-4 h-4" />
                                    </Button>
                                 </SessionDetailsSheet>
                              </ItemActions>
                           </Item>
                           {index !== sessions.length - 1 && <ItemSeparator />}
                        </Fragment>
                     ))}
                  </ItemGroup>
               )}
            </CardContent>
         </Card>
      </TooltipProvider>
   );
}

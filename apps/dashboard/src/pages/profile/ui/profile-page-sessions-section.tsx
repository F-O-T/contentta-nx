import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
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
                  {translate("pages.profile.sessions.title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.profile.sessions.description")}
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label={translate(
                              "pages.profile.sessions.actions.title",
                           )}
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                           {translate("pages.profile.sessions.actions.title")}
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
                              {translate(
                                 "pages.profile.sessions.actions.revoke-others",
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
                              {translate(
                                 "pages.profile.sessions.actions.revoke-all",
                              )}
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
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
                                       "pages.profile.sessions.item.unknown-device",
                                    )}
                              </ItemTitle>
                              <ItemDescription>
                                 <span>
                                    {translate(
                                       "pages.profile.sessions.item.ip-address",
                                    )}
                                 </span>
                                 <span>:</span>
                                 <span> {session.ipAddress || "-"}</span>
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <SessionDetailsSheet
                                 currentSessionId={currentSessionId}
                                 session={session}
                              >
                                 <Button
                                    aria-label={translate(
                                       "pages.profile.sessions.item.details",
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
            </CardContent>
         </Card>
      </TooltipProvider>
   );
}

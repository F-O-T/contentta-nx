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
import { createErrorFallback } from "@packages/ui/components/error-fallback";
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
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Monitor, MoreVertical, Trash2 } from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { SessionDetailsForm } from "../features/session-details-form";
import {
   useRevokeAllSessions,
   useRevokeOtherSessions,
} from "../features/use-session-actions";

function SessionsSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.sessions.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.sessions.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.sessions.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.sessions.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function SessionsSectionSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
            <CardAction>
               <Skeleton className="size-8" />
            </CardAction>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {Array.from({ length: 3 }).map((_, index) => (
                  <Fragment key={`session-skeleton-${index + 1}`}>
                     <Item>
                        <ItemMedia variant="icon">
                           <Skeleton className="size-4" />
                        </ItemMedia>
                        <ItemContent className="truncate">
                           <Skeleton className="h-5 w-1/2" />
                           <Skeleton className="h-4 w-3/4" />
                        </ItemContent>
                        <ItemActions>
                           <Skeleton className="size-8" />
                        </ItemActions>
                     </Item>
                     {index !== 2 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

function SessionsSectionContent() {
   const trpc = useTRPC();
   const { openSheet } = useSheet();
   const { data: sessions } = useSuspenseQuery(
      trpc.session.listAllSessions.queryOptions(),
   );
   const { data: currentSession } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   const { revokeOtherSessions, isRevoking: isRevokingOthers } =
      useRevokeOtherSessions();
   const { revokeAllSessions, isRevoking: isRevokingAll } =
      useRevokeAllSessions();

   return (
      <TooltipProvider>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("dashboard.routes.profile.sessions.title")}
               </CardTitle>
               <CardDescription>
                  {translate("dashboard.routes.profile.sessions.description")}
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <DropdownMenuTrigger asChild>
                              <Button
                                 aria-label={translate(
                                    "dashboard.routes.profile.sessions.actions.title",
                                 )}
                                 size="icon"
                                 variant="ghost"
                              >
                                 <MoreVertical className="w-5 h-5" />
                              </Button>
                           </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                           {translate(
                              "dashboard.routes.profile.sessions.actions.title",
                           )}
                        </TooltipContent>
                     </Tooltip>
                     <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                           {translate(
                              "dashboard.routes.profile.sessions.actions.title",
                           )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem
                              disabled={isRevokingOthers}
                              onClick={revokeOtherSessions}
                              variant="destructive"
                           >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {translate(
                                 "dashboard.routes.profile.sessions.actions.revoke-others",
                              )}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              disabled={isRevokingAll}
                              onClick={revokeAllSessions}
                              variant="destructive"
                           >
                              <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                              {translate(
                                 "dashboard.routes.profile.sessions.actions.revoke-all",
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
                                       "dashboard.routes.profile.sessions.item.unknown-device",
                                    )}
                              </ItemTitle>
                              <ItemDescription>
                                 <span>
                                    {translate(
                                       "dashboard.routes.profile.sessions.item.ip-address",
                                    )}
                                 </span>
                                 <span>:</span>
                                 <span> {session.ipAddress || "-"}</span>
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <Button
                                 onClick={() =>
                                    openSheet({
                                       children: (
                                          <SessionDetailsForm
                                             currentSessionId={
                                                currentSession?.session.id || ""
                                             }
                                             session={session}
                                          />
                                       ),
                                    })
                                 }
                                 size="icon"
                                 variant="ghost"
                              >
                                 <ChevronRight className="size-4" />
                              </Button>
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

export function ProfilePageSessionsSection() {
   return (
      <ErrorBoundary FallbackComponent={SessionsSectionErrorFallback}>
         <Suspense fallback={<SessionsSectionSkeleton />}>
            <SessionsSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}

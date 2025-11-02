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
   Empty,
   EmptyContent,
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
import { Skeleton } from "@packages/ui/components/skeleton";
import { toast } from "@packages/ui/components/sonner";
import { TooltipProvider } from "@packages/ui/components/tooltip";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { AlertCircle, Info, Monitor, MoreVertical, Trash2 } from "lucide-react";
import { Fragment, Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";
import { SessionDetailsSheet } from "../features/session-details-sheet";

function SessionsSectionErrorFallback() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("pages.profile.sessions.title")}</CardTitle>
            <CardDescription>
               {translate("pages.profile.sessions.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate("pages.profile.sessions.state.error.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                     {translate(
                        "pages.profile.sessions.state.error.description",
                     )}
                  </EmptyDescription>
               </EmptyHeader>
               <EmptyContent>
                  <Button
                     onClick={() => window.location.reload()}
                     size="sm"
                     variant="outline"
                  >
                     {translate("common.actions.retry")}
                  </Button>
               </EmptyContent>
            </Empty>
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
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { data: sessions } = useSuspenseQuery(
      trpc.session.listAllSessions.queryOptions(),
   );
   const { data: currentSession } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   // Mutations
   const revokeOtherSessionsMutation = useMutation(
      trpc.session.revokeOtherSessions.mutationOptions({
         onError: () => {
            toast.error("Failed to revoke other sessions.");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.session.listAllSessions.queryKey(),
            });
            toast.success("Other sessions have been revoked successfully.");
         },
      }),
   );
   const revokeAllSessionsMutation = useMutation(
      trpc.session.revokeSessions.mutationOptions({
         onError: () => {
            toast.error("Failed to revoke all sessions.");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.session.listAllSessions.queryKey(),
            });
            toast.success("All sessions have been revoked successfully.");
         },
      }),
   );

   // Memoize dropdown menu items
   const dropdownMenuItems = useMemo(
      () => [
         {
            action: async () => await revokeOtherSessionsMutation.mutateAsync(),
            disabled: revokeOtherSessionsMutation.isPending,
            icon: <Trash2 className="w-4 h-4 mr-2" />,
            id: "revoke-others",
            label: translate("pages.profile.sessions.actions.revoke-others"),
            variant: "destructive" as const,
         },
         {
            action: async () => await revokeAllSessionsMutation.mutateAsync(),
            disabled: revokeAllSessionsMutation.isPending,
            icon: <Trash2 className="w-4 h-4 mr-2 text-destructive" />,
            id: "revoke-all",
            label: translate("pages.profile.sessions.actions.revoke-all"),
            variant: "destructive" as const,
         },
      ],
      [
         revokeOtherSessionsMutation.isPending,
         revokeAllSessionsMutation.isPending,
         revokeOtherSessionsMutation.mutateAsync,
         revokeAllSessionsMutation.mutateAsync,
      ],
   );

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
                           {dropdownMenuItems.map((item) => (
                              <AlertDialog key={item.id}>
                                 <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                       disabled={item.disabled}
                                       onSelect={(e) => e.preventDefault()}
                                       variant={item.variant}
                                    >
                                       {item.icon}
                                       {item.label}
                                    </DropdownMenuItem>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                       <AlertDialogTitle>
                                          {translate(
                                             "common.delete-confirmation.title",
                                          )}
                                       </AlertDialogTitle>
                                       <AlertDialogDescription>
                                          {translate(
                                             "common.delete-confirmation.description",
                                          )}
                                       </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                       <AlertDialogCancel>
                                          {translate("common.actions.cancel")}
                                       </AlertDialogCancel>
                                       <AlertDialogAction
                                          disabled={item.disabled}
                                          onClick={item.action}
                                       >
                                          {item.label}
                                       </AlertDialogAction>
                                    </AlertDialogFooter>
                                 </AlertDialogContent>
                              </AlertDialog>
                           ))}
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
                                 currentSessionId={
                                    currentSession?.session.id || ""
                                 }
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

export function ProfilePageSessionsSection() {
   return (
      <ErrorBoundary FallbackComponent={SessionsSectionErrorFallback}>
         <Suspense fallback={<SessionsSectionSkeleton />}>
            <SessionsSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}

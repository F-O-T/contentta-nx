import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
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
import {
   ChevronRight,
   Globe,
   Laptop,
   Link2,
   Mail,
   Monitor,
   Shield,
   Smartphone,
   Tablet,
   Trash2,
   User,
} from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useSheet } from "@/hooks/use-sheet";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { SessionDetailsForm } from "@/pages/profile/features/session-details-form";
import {
   useRevokeAllSessions,
   useRevokeOtherSessions,
} from "@/pages/profile/features/use-session-actions";

function getDeviceIcon(userAgent: string | null | undefined) {
   if (!userAgent) return Monitor;
   const ua = userAgent.toLowerCase();
   if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android"))
      return Smartphone;
   if (ua.includes("tablet") || ua.includes("ipad")) return Tablet;
   if (ua.includes("mac") || ua.includes("windows") || ua.includes("linux"))
      return Laptop;
   return Monitor;
}

function formatLastActive(date: Date | string | null): string {
   if (!date) return translate("common.time.now");
   const d = new Date(date);
   const now = new Date();
   const diff = now.getTime() - d.getTime();
   const minutes = Math.floor(diff / 60000);
   const hours = Math.floor(diff / 3600000);
   const days = Math.floor(diff / 86400000);

   if (minutes < 1) return translate("common.time.now");
   if (minutes < 60)
      return translate("common.time.minutes-ago", { count: minutes });
   if (hours < 24) return translate("common.time.hours-ago", { count: hours });
   if (days < 7) return translate("common.time.days-ago", { count: days });
   return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
   });
}

function getLoginMethodDisplay(method: string | null | undefined): {
   label: string;
   Icon: typeof Mail;
} | null {
   if (!method) return null;

   switch (method) {
      case "email":
         return {
            label: translate(
               "dashboard.routes.settings.security.login-methods.email",
            ),
            Icon: Mail,
         };
      case "google":
         return {
            label: translate(
               "dashboard.routes.settings.security.login-methods.google",
            ),
            Icon: Globe,
         };
      case "otp":
         return {
            label: translate(
               "dashboard.routes.settings.security.login-methods.otp",
            ),
            Icon: Shield,
         };
      case "magic-link":
         return {
            label: translate(
               "dashboard.routes.settings.security.login-methods.magic-link",
            ),
            Icon: Link2,
         };
      case "anonymous":
         return {
            label: translate(
               "dashboard.routes.settings.security.login-methods.anonymous",
            ),
            Icon: User,
         };
      default:
         return { label: method, Icon: Shield };
   }
}

function SecuritySectionErrorFallback(props: FallbackProps) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.security.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.security.description")}
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

function SecuritySectionSkeleton() {
   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Sessions Card Skeleton */}
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1">
                        {Array.from({ length: 3 }, (_, i) => i + 1).map(
                           (id) => (
                              <Skeleton
                                 className="h-16 w-full rounded-lg"
                                 key={id}
                              />
                           ),
                        )}
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Security Overview Skeleton */}
            <Card className="h-full">
               <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4 text-center">
                     <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                     <Skeleton className="h-10 w-16 mx-auto mb-2" />
                     <Skeleton className="h-5 w-24 mx-auto" />
                  </div>
                  <div className="space-y-2">
                     <Skeleton className="h-10 w-full rounded-lg" />
                     <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

// ============================================
// Sessions Card Component
// ============================================

type SessionType = Parameters<typeof SessionDetailsForm>[0]["session"];

function SessionsCard({
   sessions,
   currentSessionId,
   currentSessionLoginMethod,
   openSheet,
}: {
   sessions: SessionType[];
   currentSessionId: string | undefined;
   currentSessionLoginMethod: string | null;
   openSheet: (options: { children: React.ReactNode }) => void;
}) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.security.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.settings.security.sessions-description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {sessions.length === 0 ? (
               <Empty className="border-none py-4">
                  <EmptyHeader>
                     <EmptyMedia variant="icon">
                        <Globe className="size-6" />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.settings.security.sessions.empty-title",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.settings.security.sessions.empty-description",
                        )}
                     </EmptyDescription>
                  </EmptyHeader>
               </Empty>
            ) : (
               <ItemGroup>
                  {sessions.map((session, index) => {
                     const isCurrentSession = session.id === currentSessionId;
                     const DeviceIcon = getDeviceIcon(
                        session.userAgent ?? null,
                     );
                     // Only show login method for the current session (cookie-based storage)
                     const loginMethod = isCurrentSession
                        ? getLoginMethodDisplay(currentSessionLoginMethod)
                        : null;

                     return (
                        <Fragment key={session.id}>
                           <Item variant="muted">
                              <ItemMedia variant="icon">
                                 <DeviceIcon className="size-4" />
                              </ItemMedia>
                              <ItemContent className="min-w-0">
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <ItemTitle className="truncate">
                                       {session.userAgent ||
                                          translate(
                                             "dashboard.routes.profile.sessions.item.unknown-device",
                                          )}
                                    </ItemTitle>
                                    {isCurrentSession && (
                                       <Badge
                                          className="bg-green-500 hover:bg-green-500/90 shrink-0"
                                          variant="default"
                                       >
                                          {translate(
                                             "dashboard.routes.settings.security.sessions.current-device",
                                          )}
                                       </Badge>
                                    )}
                                 </div>
                                 <ItemDescription className="flex items-center gap-2 flex-wrap">
                                    <span>
                                       {session.ipAddress ||
                                          translate(
                                             "dashboard.routes.settings.security.sessions.unknown-ip",
                                          )}
                                    </span>
                                    {loginMethod && (
                                       <>
                                          <span className="text-muted-foreground/50">
                                             •
                                          </span>
                                          <span className="flex items-center gap-1">
                                             <loginMethod.Icon className="size-3" />
                                             {loginMethod.label}
                                          </span>
                                       </>
                                    )}
                                    <span className="text-muted-foreground/50">
                                       •
                                    </span>
                                    <span>
                                       {formatLastActive(session.updatedAt)}
                                    </span>
                                 </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                       <Button
                                          onClick={() =>
                                             openSheet({
                                                children: (
                                                   <SessionDetailsForm
                                                      currentSessionId={
                                                         currentSessionId || ""
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
                                    </TooltipTrigger>
                                    <TooltipContent>
                                       {translate(
                                          "dashboard.routes.settings.security.sessions.view-details",
                                       )}
                                    </TooltipContent>
                                 </Tooltip>
                              </ItemActions>
                           </Item>
                           {index !== sessions.length - 1 && <ItemSeparator />}
                        </Fragment>
                     );
                  })}
               </ItemGroup>
            )}
         </CardContent>
      </Card>
   );
}

// ============================================
// Security Overview Card Component
// ============================================

function SecurityOverviewCard({
   sessionsCount,
   otherSessionsCount,
   isRevokingOthers,
   isRevokingAll,
   revokeOtherSessions,
   revokeAllSessions,
}: {
   sessionsCount: number;
   otherSessionsCount: number;
   isRevokingOthers: boolean;
   isRevokingAll: boolean;
   revokeOtherSessions: () => void;
   revokeAllSessions: () => void;
}) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.security.overview.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.settings.security.overview.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
               <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  {translate(
                     "dashboard.routes.settings.security.overview.active-sessions",
                  )}
               </p>
               <p className="text-3xl md:text-4xl font-bold">{sessionsCount}</p>
               <Badge className="mt-2" variant="secondary">
                  <Shield className="size-3 mr-1" />
                  {sessionsCount === 1
                     ? translate(
                          "dashboard.routes.settings.security.overview.device",
                       )
                     : translate(
                          "dashboard.routes.settings.security.overview.devices",
                       )}
               </Badge>
            </div>

            <div className="space-y-2">
               <Button
                  className="w-full"
                  disabled={isRevokingOthers || otherSessionsCount === 0}
                  onClick={revokeOtherSessions}
                  variant="outline"
               >
                  <Trash2 className="size-4 mr-2" />
                  {translate(
                     "dashboard.routes.profile.sessions.actions.revoke-others",
                  )}
               </Button>
               <Button
                  className="w-full"
                  disabled={isRevokingAll}
                  onClick={revokeAllSessions}
                  variant="destructive"
               >
                  <Trash2 className="size-4 mr-2" />
                  {translate(
                     "dashboard.routes.profile.sessions.actions.revoke-all",
                  )}
               </Button>
            </div>
         </CardContent>
      </Card>
   );
}

// ============================================
// Main Content Component
// ============================================

function SecuritySectionContent() {
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

   const currentSessionId = currentSession?.session?.id;
   const currentSessionLoginMethod =
      betterAuthClient.getLastUsedLoginMethod() ?? null;
   const otherSessionsCount = sessions.filter(
      (s) => s.id !== currentSessionId,
   ).length;

   return (
      <TooltipProvider>
         <div className="space-y-4 md:space-y-6">
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
               <div className="md:col-span-2 lg:col-span-2">
                  <SessionsCard
                     currentSessionId={currentSessionId}
                     currentSessionLoginMethod={currentSessionLoginMethod}
                     openSheet={openSheet}
                     sessions={sessions}
                  />
               </div>
               <SecurityOverviewCard
                  isRevokingAll={isRevokingAll}
                  isRevokingOthers={isRevokingOthers}
                  otherSessionsCount={otherSessionsCount}
                  revokeAllSessions={revokeAllSessions}
                  revokeOtherSessions={revokeOtherSessions}
                  sessionsCount={sessions.length}
               />
            </div>
         </div>
      </TooltipProvider>
   );
}

export function SecuritySection() {
   return (
      <ErrorBoundary FallbackComponent={SecuritySectionErrorFallback}>
         <Suspense fallback={<SecuritySectionSkeleton />}>
            <SecuritySectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}

import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
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
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { BadgeCheck, Bell, CreditCard, LogOut, Sparkles } from "lucide-react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import {
   betterAuthClient,
   type Session,
   useTRPC,
} from "@/integrations/clients";
import { LanguageCommand } from "./language-command";
import { ThemeSwitcher } from "./theme-provider";

function NavUserCredenza({
   session,
   activeOrganization,
   onNavigate,
   onLogout,
   hasActiveSubscription,
}: {
   session: Session;
   activeOrganization: { slug: string };
   onNavigate: () => void;
   onLogout: () => void;
   hasActiveSubscription: boolean;
}) {
   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate("dashboard.layout.nav-user.greeting", {
                  name: session.user.name,
               })}
            </CredenzaTitle>
            <CredenzaDescription className="truncate">
               {session.user.email}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {!hasActiveSubscription && (
               <Button
                  asChild
                  className="w-full justify-start gap-2"
                  onClick={onNavigate}
                  variant="outline"
               >
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     to="/$slug/settings/billing"
                  >
                     <Sparkles className="size-4" />
                     {translate("dashboard.layout.nav-user.main.upgrade")}
                  </Link>
               </Button>
            )}

            <div className="space-y-2">
               <Button
                  asChild
                  className="w-full justify-start gap-2"
                  onClick={onNavigate}
                  variant="outline"
               >
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     to="/$slug/settings/profile"
                  >
                     <BadgeCheck className="size-4" />
                     {translate("dashboard.layout.nav-user.main.account")}
                  </Link>
               </Button>
               <Button
                  asChild
                  className="w-full justify-start gap-2"
                  onClick={onNavigate}
                  variant="outline"
               >
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     to="/$slug/settings/billing"
                  >
                     <CreditCard className="size-4" />
                     {translate("dashboard.layout.nav-user.main.billing")}
                  </Link>
               </Button>
               <Button
                  asChild
                  className="w-full justify-start gap-2"
                  onClick={onNavigate}
                  variant="outline"
               >
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     to="/$slug/settings/notifications"
                  >
                     <Bell className="size-4" />
                     {translate("dashboard.layout.nav-user.main.notifications")}
                  </Link>
               </Button>
            </div>

            <div className="space-y-3">
               <span className="text-sm font-medium text-muted-foreground">
                  {translate("dashboard.layout.nav-user.preferences.label")}
               </span>
               <div className="flex items-center justify-between">
                  <span className="text-sm">
                     {translate("dashboard.layout.nav-user.preferences.theme")}
                  </span>
                  <ThemeSwitcher />
               </div>
               <div className="flex items-center justify-between gap-8">
                  <span className="text-sm">
                     {translate(
                        "dashboard.layout.nav-user.preferences.language",
                     )}
                  </span>
                  <LanguageCommand />
               </div>
            </div>
         </CredenzaBody>

         <CredenzaFooter>
            <Button
               className="w-full gap-2"
               onClick={onLogout}
               variant="destructive"
            >
               <LogOut className="size-4" />
               {translate("dashboard.layout.nav-user.actions.logout")}
            </Button>
         </CredenzaFooter>
      </>
   );
}

// Simple ErrorBoundary implementation
function NavUserErrorFallback() {
   return (
      <div className="p-4 text-center text-destructive">
         Failed to load user info.
      </div>
   );
}

// Skeleton for loading state
function NavUserSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" size="lg">
               <Skeleton className="h-8 w-8 rounded-lg mr-3" />
               <div className="grid flex-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
               </div>
               <Skeleton className="ml-auto size-4" />
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

// Extracted content with Suspense logic
function NavUserContent() {
   const { activeOrganization, activeSubscription } = useActiveOrganization();
   const hasActiveSubscription =
      activeSubscription?.status === "active" ||
      activeSubscription?.status === "trialing";
   const { isMobile, setOpenMobile } = useSidebar();
   const router = useRouter();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { openCredenza, closeCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   const handleLogout = useCallback(async () => {
      await betterAuthClient.signOut({
         fetchOptions: {
            onError: ({ error }) => {
               toast.error(error.message, { id: "logout" });
            },
            onRequest: () => {
               toast.loading(
                  translate("dashboard.layout.nav-user.messages.logging-out"),
                  { id: "logout" },
               );
            },
            onSuccess: async () => {
               await queryClient.invalidateQueries({
                  queryKey: trpc.session.getSession.queryKey(),
               });
               router.navigate({
                  to: "/auth/sign-in",
               });
               toast.success(
                  translate(
                     "dashboard.layout.nav-user.messages.logout-success",
                  ),
                  { id: "logout" },
               );
            },
         },
      });
      setOpenMobile(false);
   }, [queryClient, router.navigate, setOpenMobile, trpc.session.getSession]);

   const handleLogoutClick = useCallback(() => {
      closeCredenza();
      openAlertDialog({
         actionLabel: translate("dashboard.layout.nav-user.actions.logout"),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "dashboard.layout.nav-user.logout-confirmation.description",
         ),
         onAction: handleLogout,
         title: translate(
            "dashboard.layout.nav-user.logout-confirmation.title",
         ),
         variant: "destructive",
      });
   }, [closeCredenza, openAlertDialog, handleLogout]);

   const handleNavigate = useCallback(() => {
      closeCredenza();
      setOpenMobile(false);
   }, [closeCredenza, setOpenMobile]);

   const handleOpenCredenza = useCallback(() => {
      if (!session) return;
      const currentSession = session;
      openCredenza({
         children: (
            <NavUserCredenza
               activeOrganization={activeOrganization}
               hasActiveSubscription={hasActiveSubscription}
               onLogout={handleLogoutClick}
               onNavigate={handleNavigate}
               session={currentSession}
            />
         ),
      });
   }, [
      openCredenza,
      session,
      activeOrganization,
      hasActiveSubscription,
      handleNavigate,
      handleLogoutClick,
   ]);

   // Mobile/PWA: Use Credenza
   if (isMobile) {
      return (
         <SidebarMenu>
            <SidebarMenuItem>
               <Avatar
                  className="border-border border-2 cursor-pointer"
                  onClick={handleOpenCredenza}
               >
                  <AvatarImage
                     alt={session?.user.name}
                     src={session?.user.image ?? ""}
                  />
                  <AvatarFallback className="rounded-lg">
                     {session?.user.name?.charAt(0) || "?"}
                  </AvatarFallback>
               </Avatar>
            </SidebarMenuItem>
         </SidebarMenu>
      );
   }

   // Desktop: Use DropdownMenu
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Avatar className="border-border border-2 cursor-pointer">
                     <AvatarImage
                        alt={session?.user.name}
                        src={session?.user.image ?? ""}
                     />
                     <AvatarFallback className="rounded-lg">
                        {session?.user.name?.charAt(0) || "?"}
                     </AvatarFallback>
                  </Avatar>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="end"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  sideOffset={4}
               >
                  {/* Header */}
                  <DropdownMenuLabel className="p-0 font-normal">
                     <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                           <AvatarImage
                              alt={session?.user.name}
                              src={session?.user.image ?? ""}
                           />
                           <AvatarFallback className="rounded-lg">
                              {session?.user.name?.charAt(0) || "?"}
                           </AvatarFallback>
                        </Avatar>
                        <div className="grid  flex-1 text-left text-sm leading-tight">
                           <span className="truncate font-medium">
                              {session?.user.name}
                           </span>
                           <span className="max-w-52 truncate text-xs text-muted-foreground">
                              {session?.user.email}
                           </span>
                        </div>
                     </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Upgrade - only show if no active subscription */}
                  {!hasActiveSubscription && (
                     <>
                        <DropdownMenuGroup>
                           <DropdownMenuItem asChild>
                              <Link
                                 params={{ slug: activeOrganization.slug }}
                                 to="/$slug/settings/billing"
                              >
                                 <Sparkles />
                                 {translate(
                                    "dashboard.layout.nav-user.main.upgrade",
                                 )}
                              </Link>
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                     </>
                  )}

                  {/* Navigation */}
                  <DropdownMenuGroup>
                     <DropdownMenuItem asChild>
                        <Link
                           params={{ slug: activeOrganization.slug }}
                           to="/$slug/settings/profile"
                        >
                           <BadgeCheck />
                           {translate("dashboard.layout.nav-user.main.account")}
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link
                           params={{ slug: activeOrganization.slug }}
                           to="/$slug/settings/billing"
                        >
                           <CreditCard />
                           {translate("dashboard.layout.nav-user.main.billing")}
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link
                           params={{ slug: activeOrganization.slug }}
                           to="/$slug/settings/notifications"
                        >
                           <Bell />
                           {translate(
                              "dashboard.layout.nav-user.main.notifications",
                           )}
                        </Link>
                     </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />

                  {/* Preferences */}
                  <DropdownMenuLabel>
                     {translate("dashboard.layout.nav-user.preferences.label")}
                  </DropdownMenuLabel>
                  <div className="px-2 py-1.5 space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="text-sm">
                           {translate(
                              "dashboard.layout.nav-user.preferences.theme",
                           )}
                        </span>
                        <ThemeSwitcher />
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm">
                           {translate(
                              "dashboard.layout.nav-user.preferences.language",
                           )}
                        </span>
                        <LanguageCommand />
                     </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem onClick={handleLogoutClick}>
                     <LogOut />
                     {translate("dashboard.layout.nav-user.actions.logout")}
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

// Export with Suspense and ErrorBoundary
export function NavUser() {
   return (
      <ErrorBoundary FallbackComponent={NavUserErrorFallback}>
         <Suspense fallback={<NavUserSkeleton />}>
            <NavUserContent />
         </Suspense>
      </ErrorBoundary>
   );
}

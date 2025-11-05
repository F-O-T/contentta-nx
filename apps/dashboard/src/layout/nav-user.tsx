import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
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
import { Crown, LogOutIcon, UserCircleIcon } from "lucide-react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { SubscriptionPlansCredenza } from "@/widgets/subscription/ui/subscription-plans-credenza";

function UserAvatarInfo({
   name,
   email,
   image,
   grayscale,
}: {
   name?: string;
   email?: string;
   image?: string;
   grayscale?: boolean;
}) {
   return (
      <>
         <Avatar
            className={`h-8 w-8 rounded-lg${grayscale ? " grayscale" : ""}`}
         >
            <AvatarImage alt={name} src={image ?? undefined} />
            <AvatarFallback className="rounded-lg">
               {name?.charAt(0) || "?"}
            </AvatarFallback>
         </Avatar>
         <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
               {email}
            </span>
         </div>
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
   const { setOpenMobile } = useSidebar();
   const router = useRouter();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );
   const { data: billingInfo } = useSuspenseQuery(
      trpc.authHelpers.getBillingInfo.queryOptions(),
   );
   const handleLogout = useCallback(async () => {
      await betterAuthClient.signOut(
         {},
         {
            onSuccess: async () => {
               await queryClient.invalidateQueries({
                  queryKey: trpc.authHelpers.getSession.queryKey(),
               });
               router.navigate({
                  to: "/auth/sign-in",
               });
            },
         },
      );
      setOpenMobile(false);
   }, [
      router,
      setOpenMobile,
      queryClient,
      trpc.authHelpers.getSession.queryKey,
      trpc.authHelpers.getSession,
   ]);

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger className="cursor-pointer py-4">
                  <Avatar>
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
                  <DropdownMenuLabel className="p-0 font-normal">
                     <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserAvatarInfo
                           email={session?.user.email}
                           image={session?.user.image ?? ""}
                           name={session?.user.name}
                        />
                     </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                     <DropdownMenuItem asChild>
                        <Button
                           asChild
                           className="w-full items-center cursor-pointer justify-start flex gap-2 h-12"
                           onClick={() => setOpenMobile(false)}
                           variant="ghost"
                        >
                           <Link to="/profile">
                              <UserCircleIcon />
                              Account
                           </Link>
                        </Button>
                     </DropdownMenuItem>
                     {billingInfo?.billingState === "no_subscription" && (
                        <DropdownMenuItem asChild>
                           <SubscriptionPlansCredenza>
                              <Button
                                 className="w-full items-center cursor-pointer justify-start flex gap-2 h-12"
                                 onClick={() => setOpenMobile(false)}
                                 variant="ghost"
                              >
                                 <Crown className="h-4 w-4" />
                                 Upgrade Plan
                              </Button>
                           </SubscriptionPlansCredenza>
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                     <Button
                        className="w-full cursor-pointer items-center justify-start flex gap-2"
                        onClick={handleLogout}
                        variant="ghost"
                     >
                        <LogOutIcon />
                        Log out
                     </Button>
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

import {
   betterAuthClient,
   useTRPC,
   type Session,
} from "@/integrations/clients";
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
import {
   LogOutIcon,
   MoreVerticalIcon,
   UserCircleIcon,
   KeyIcon,
   Building2,
} from "lucide-react";
import { useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
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
            <SidebarMenuButton size="lg" className="pointer-events-none">
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
// No client-side session fetch, session comes from props
function NavUserContent({ session }: { session: Session | null }) {
   const { isMobile, setOpenMobile } = useSidebar();
   const router = useRouter();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { data: customer } = useSuspenseQuery(
      trpc.authHelpers.getCustomerState.queryOptions(),
   );
   const { data: organization } = useSuspenseQuery(
      trpc.authHelpers.getDefaultOrganization.queryOptions(),
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
   if (!session) return <NavUserSkeleton />;

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                     size="lg"
                  >
                     <UserAvatarInfo
                        name={session?.user.name}
                        email={session?.user.email}
                        image={session?.user.image ?? ""}
                        grayscale
                     />
                     <MoreVerticalIcon className="ml-auto size-4" />
                  </SidebarMenuButton>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="end"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={4}
               >
                  <DropdownMenuLabel className="p-0 font-normal">
                     <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserAvatarInfo
                           name={session?.user.name}
                           email={session?.user.email}
                           image={session?.user.image ?? ""}
                        />
                     </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                     <DropdownMenuItem asChild>
                        <Button
                           className="w-full items-center cursor-pointer justify-start flex gap-2 h-12"
                           variant="ghost"
                           onClick={() => setOpenMobile(false)}
                           asChild
                        >
                           <Link to="/profile">
                              <UserCircleIcon />
                              Account
                           </Link>
                        </Button>
                     </DropdownMenuItem>
                     {customer.activeSubscriptions && (
                        <DropdownMenuItem asChild>
                           <Button
                              className="w-full items-center cursor-pointer justify-start flex gap-2 h-12"
                              variant="ghost"
                              onClick={() => setOpenMobile(false)}
                              asChild
                           >
                              <Link to="/apikey">
                                 <KeyIcon />
                                 Api keys
                              </Link>
                           </Button>
                        </DropdownMenuItem>
                     )}
                     {(customer.activeSubscriptions || organization) && (
                        <DropdownMenuItem asChild>
                           <Button
                              className="w-full items-center cursor-pointer justify-start flex gap-2 h-12"
                              variant="ghost"
                              onClick={() => setOpenMobile(false)}
                              asChild
                           >
                              <Link to="/organization">
                                 <Building2 />
                                 Organizations
                              </Link>
                           </Button>
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                     <Button
                        onClick={handleLogout}
                        className="w-full cursor-pointer items-center justify-start flex gap-2"
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
export function NavUser({ session }: { session: Session | null }) {
   return (
      <ErrorBoundary FallbackComponent={NavUserErrorFallback}>
         <NavUserContent session={session} />
      </ErrorBoundary>
   );
}

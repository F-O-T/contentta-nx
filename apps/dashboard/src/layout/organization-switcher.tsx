import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   DropdownMenu,
   DropdownMenuContent,
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
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronsUpDown } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

function OrganizationSwitcherErrorFallback() {
   return (
      <div className=" text-center text-destructive">
         Failed to load active organization.
      </div>
   );
}

function OrganizationDropdownErrorFallback() {
   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Switch Organization
         </DropdownMenuLabel>
         <DropdownMenuItem disabled>
            You dont have other organizations
         </DropdownMenuItem>
      </>
   );
}

function OrganizationSwitcherSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton size="lg">
               <Skeleton className="size-8 rounded-lg" />
               <div className="grid flex-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
               </div>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

function OrganizationDropdownSkeleton() {
   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Switch Organization
         </DropdownMenuLabel>
         <DropdownMenuItem disabled>
            <div className="gap-2 p-2 w-full">
               <Skeleton className="size-6 rounded" />
               <Skeleton className="h-4 w-20" />
            </div>
         </DropdownMenuItem>
      </>
   );
}

export function OrganizationSwitcher() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationSwitcherErrorFallback}>
         <Suspense fallback={<OrganizationSwitcherSkeleton />}>
            <OrganizationSwitcherContent />
         </Suspense>
      </ErrorBoundary>
   );
}

function OrganizationDropdownContent() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   // Get organizations for switching (excluding active one)
   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );

   const setActiveOrganizationMutation = useMutation(
      trpc.organization.setActiveOrganization.mutationOptions({
         onError: (error) => {
            console.error("Failed to set active organization:", error);
            toast.error("Failed to switch organization. Please try again.");
         },
         onSuccess: async () => {
            // Invalidate session query to refetch with updated active organization
            await queryClient.invalidateQueries({
               queryKey: trpc.authHelpers.getSession.queryKey(),
            });

            // Invalidate other queries that depend on the active organization
            await queryClient.invalidateQueries({
               queryKey: trpc.authHelpers.getBillingInfo.queryKey(),
            });

            // Invalidate organizations query to refresh the list
            await queryClient.invalidateQueries({
               queryKey: trpc.organization.getOrganizations.queryKey(),
            });

            toast.success("Active organization updated successfully");
         },
      }),
   );

   const handleSetActiveOrganization = async (organizationId: string) => {
      setActiveOrganizationMutation.mutate({ organizationId });
   };

   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Switch Organization
         </DropdownMenuLabel>

         {organizations?.length === 0 && (
            <DropdownMenuItem disabled>
               <div className="p-2 text-muted-foreground text-sm w-full text-center">
                  No other organizations
               </div>
            </DropdownMenuItem>
         )}

         {organizations?.map((organization) => (
            <DropdownMenuItem
               className="gap-2 p-2"
               disabled={setActiveOrganizationMutation.isPending}
               key={organization.id}
               onClick={() => handleSetActiveOrganization(organization.id)}
            >
               <Avatar className="size-6">
                  <AvatarImage
                     alt={organization.name}
                     src={organization.logo ?? ""}
                  />
                  <AvatarFallback className="text-xs">
                     {organization.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
               </Avatar>
               <div className="flex-1">{organization.name}</div>
            </DropdownMenuItem>
         ))}
      </>
   );
}

function OrganizationSwitcherContent() {
   const { isMobile } = useSidebar();
   const trpc = useTRPC();

   const { data: activeOrganization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                     size="lg"
                  >
                     <Avatar className="size-8 rounded-lg">
                        <AvatarImage
                           alt={activeOrganization?.name || "Personal"}
                           src={activeOrganization?.logo ?? ""}
                        />
                        <AvatarFallback className="rounded-lg">
                           {activeOrganization?.name
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}
                        </AvatarFallback>
                     </Avatar>
                     <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                           {activeOrganization?.name || "Personal"}
                        </span>
                        <span className="truncate text-xs">
                           {activeOrganization
                              ? "Organization"
                              : "Personal Account"}
                        </span>
                     </div>
                     <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={4}
               >
                  {/* Current organization section */}
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                     Current Organization
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />
                  {activeOrganization && (
                     <DropdownMenuItem asChild>
                        <Link className="w-full flex gap-2" to="/organization">
                           View Organization
                           <ArrowUpRight className=" size-4" />
                        </Link>
                     </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {/* Other organizations list with suspense */}
                  <ErrorBoundary
                     FallbackComponent={OrganizationDropdownErrorFallback}
                  >
                     <Suspense fallback={<OrganizationDropdownSkeleton />}>
                        <OrganizationDropdownContent />
                     </Suspense>
                  </ErrorBoundary>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

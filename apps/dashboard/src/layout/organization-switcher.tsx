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
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Building, ChevronsUpDown } from "lucide-react";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
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
            Teams
         </DropdownMenuLabel>
         <DropdownMenuItem disabled>Failed to load teams</DropdownMenuItem>
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
            Teams
         </DropdownMenuLabel>
         <DropdownMenuItem disabled>
            <div className="gap-2 p-2 w-full flex items-center">
               <Skeleton className="size-6 rounded" />
               <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
               </div>
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

   // Get teams for the current active organization
   const { data: teams } = useSuspenseQuery(
      trpc.organization.listTeams.queryOptions(),
   );

   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Teams
         </DropdownMenuLabel>

         {teams?.length === 0 && (
            <DropdownMenuItem disabled>
               <div className="p-2 text-muted-foreground text-sm w-full text-center">
                  No teams available
               </div>
            </DropdownMenuItem>
         )}

         {teams?.map((team) => (
            <DropdownMenuItem className="gap-2 p-2" key={team.id}>
               <div className="flex-1 text-sm">{team.name}</div>
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
   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );
   const menuActions = useMemo(
      () => [
         {
            icon: Building,
            key: "view-organization",
            label: "View Organization details",
            to: "/organization",
         },
      ],
      [],
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
                     <Item className="p-0 w-full">
                        <ItemMedia>
                           <Avatar className=" rounded-lg">
                              <AvatarImage
                                 alt={activeOrganization?.name || "Personal"}
                                 src={logo?.data ?? ""}
                              />
                              <AvatarFallback className="rounded-lg">
                                 {getInitials(activeOrganization?.name ?? "")}
                              </AvatarFallback>
                           </Avatar>
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="">
                              {activeOrganization?.name || "Personal"}
                           </ItemTitle>
                           <ItemDescription className="text-xs ">
                              {activeOrganization
                                 ? activeOrganization.description
                                 : "Personal Account"}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ChevronsUpDown className="size-4" />
                        </ItemActions>
                     </Item>
                  </SidebarMenuButton>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="start"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={4}
               >
                  <DropdownMenuLabel>Current Organization</DropdownMenuLabel>

                  {activeOrganization &&
                     menuActions.map(({ key, to, icon: Icon, label }) => (
                        <DropdownMenuItem asChild key={key}>
                           <Link className="w-full flex gap-2" to={to}>
                              <Icon className="size-4" />
                              {label}
                           </Link>
                        </DropdownMenuItem>
                     ))}
                  <DropdownMenuSeparator />
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

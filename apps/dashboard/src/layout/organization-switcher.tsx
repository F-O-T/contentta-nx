import { translate } from "@packages/localization";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { toast } from "@packages/ui/components/sonner";
import { getInitials } from "@packages/utils/text";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ChevronsUpDown, Eye, Plus, Users } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { CreateTeamForm } from "@/features/organization/ui/create-team-form";
import { ManageOrganizationForm } from "@/features/organization/ui/manage-organization-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

//TODO: Adicionar textos no Locale
function OrganizationSwitcherErrorFallback() {
   return (
      <div className=" text-center text-destructive">
         {translate(
            "dashboard.layout.organization-switcher.error.failed-to-load-active",
         )}
      </div>
   );
}

function OrganizationDropdownErrorFallback() {
   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            {translate("dashboard.layout.organization-switcher.label")}
         </DropdownMenuLabel>
         <DropdownMenuItem disabled>
            {translate(
               "dashboard.layout.organization-switcher.error.failed-to-load-teams",
            )}
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
            {translate("dashboard.layout.organization-switcher.label")}
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

function OrganizationDropdownContent({
   onCreateTeamClick,
}: {
   onCreateTeamClick: () => void;
}) {
   const trpc = useTRPC();
   const router = useRouter();

   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );

   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   const { activeOrganization } = useActiveOrganization();
   const queryClient = useQueryClient();
   const { setActiveOrganization, isPending: isSettingActive } =
      useSetActiveOrganization({
         showToast: false,
      });

   async function handleOrganizationClick(
      organizationId: string,
      organizationSlug: string,
   ) {
      const isCurrentOrg = activeOrganization.slug === organizationSlug;

      await router.navigate({
         params: { slug: organizationSlug },
         to: "/$slug/home",
      });
      await queryClient.invalidateQueries();

      if (!isCurrentOrg) {
         await setActiveOrganization({ organizationId });
         toast.success("Organization set successfully");
      }
   }

   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            {translate("dashboard.layout.organization-switcher.label")}
         </DropdownMenuLabel>
         {organizations?.map((organization) => (
            <DropdownMenuSub key={organization.name}>
               <DropdownMenuSubTrigger
                  className="gap-2 p-2"
                  disabled={isSettingActive}
                  onClick={() => {
                     handleOrganizationClick(
                        organization.id,
                        organization.slug,
                     );
                  }}
               >
                  <div className="flex p-1 size-6 items-center justify-center rounded-md border">
                     {logo?.data ? (
                        <img
                           alt={organization.name}
                           className="size-3.5 shrink-0 rounded"
                           src={logo.data}
                        />
                     ) : (
                        <div className="size-4 shrink-0 flex items-center justify-center text-xs bg-secondary rounded">
                           {getInitials(organization.name)}
                        </div>
                     )}
                  </div>
                  <span className="truncate">{organization.name}</span>
               </DropdownMenuSubTrigger>
               <DropdownMenuSubContent>
                  <Suspense
                     fallback={
                        <DropdownMenuItem disabled>
                           <div className="gap-2 p-2 w-full flex items-center">
                              <Skeleton className="size-4 rounded" />
                              <Skeleton className="h-4 w-24" />
                           </div>
                        </DropdownMenuItem>
                     }
                  >
                     <OrganizationTeamsList
                        onCreateTeamClick={onCreateTeamClick}
                        onViewDetailsClick={() => {
                           router.navigate({
                              params: { slug: organization.slug },
                              to: "/$slug/organization",
                           });
                        }}
                        organizationId={organization.id}
                        organizationSlug={organization.slug}
                     />
                  </Suspense>
               </DropdownMenuSubContent>
            </DropdownMenuSub>
         ))}
      </>
   );
}

function OrganizationTeamsList({
   organizationId,
   organizationSlug,
   onCreateTeamClick,
   onViewDetailsClick,
}: {
   organizationId: string;
   organizationSlug: string;
   onCreateTeamClick: () => void;
   onViewDetailsClick: () => void;
}) {
   const trpc = useTRPC();
   const router = useRouter();

   const { data: teams } = useSuspenseQuery(
      trpc.organization.listTeamsByOrganizationId.queryOptions({
         organizationId,
      }),
   );

   //TODO: checar necessidade de repetir o dropdown menu label
   if (!teams || teams.length === 0) {
      return (
         <>
            <DropdownMenuLabel className="text-muted-foreground text-xs">
               Organização
            </DropdownMenuLabel>
            <DropdownMenuItem
               className="gap-2 flex items-center"
               onClick={onViewDetailsClick}
            >
               <Eye className="size-4" />
               <span className="truncate">Ver detalhes</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
               Equipes
            </DropdownMenuLabel>
            <DropdownMenuItem disabled>
               <div className="gap-2 p-2 w-full flex items-center">
                  <Users className="size-4" />
                  <span className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.layout.organization-switcher.no-teams",
                     )}
                  </span>
               </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateTeamClick}>
               <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
               </div>
               <span className="truncate">
                  {translate(
                     "dashboard.layout.organization-switcher.create-team",
                  )}
               </span>
            </DropdownMenuItem>
         </>
      );
   }

   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Organização
         </DropdownMenuLabel>
         <DropdownMenuItem onClick={onViewDetailsClick}>
            <Eye className="size-4" />
            <span className="truncate">Ver detalhes</span>
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Equipes
         </DropdownMenuLabel>
         {teams.map((team) => (
            <DropdownMenuItem
               key={team.id}
               onClick={() => {
                  router.navigate({
                     params: { slug: organizationSlug },
                     to: "/$slug/organization/teams",
                  });
               }}
            >
               <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Users className="size-4" />
               </div>
               <span className="truncate">{team.name}</span>
            </DropdownMenuItem>
         ))}
         <DropdownMenuSeparator />
         <DropdownMenuItem onClick={onCreateTeamClick}>
            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
               <Plus className="size-4" />
            </div>
            <span className="truncate">
               {translate("dashboard.layout.organization-switcher.create-team")}
            </span>
         </DropdownMenuItem>
      </>
   );
}

function OrganizationSwitcherContent() {
   const { isMobile } = useSidebar();
   const trpc = useTRPC();
   const { openSheet } = useSheet();

   const { activeOrganization } = useActiveOrganization();

   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );
   const { data: organizationLimit } = useSuspenseQuery(
      trpc.organization.getOrganizationLimit.queryOptions(),
   );

   const hasReachedLimit =
      (organizations?.length ?? 0) >= (organizationLimit ?? 3);

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                     size="lg"
                  >
                     <div className="rounded-md border bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        {logo?.data ? (
                           <img
                              alt={activeOrganization.name}
                              className="size-6 rounded"
                              src={logo.data}
                           />
                        ) : (
                           <span className="text-xs font-medium">
                              {getInitials(activeOrganization.name)}
                           </span>
                        )}
                     </div>
                     <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                           {activeOrganization.name}
                        </span>
                        <span className="truncate text-xs">
                           {activeOrganization.description}
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
                  <ErrorBoundary
                     FallbackComponent={OrganizationDropdownErrorFallback}
                  >
                     <Suspense fallback={<OrganizationDropdownSkeleton />}>
                        <OrganizationDropdownContent
                           onCreateTeamClick={() =>
                              openSheet({ children: <CreateTeamForm /> })
                           }
                        />
                     </Suspense>
                  </ErrorBoundary>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                     disabled={hasReachedLimit}
                     onClick={() =>
                        openSheet({ children: <ManageOrganizationForm /> })
                     }
                     title={
                        hasReachedLimit
                           ? translate(
                                "dashboard.layout.organization-switcher.limit-reached",
                             )
                           : undefined
                     }
                  >
                     <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                        <Plus className="size-4" />
                     </div>
                     <div className="text-muted-foreground font-medium">
                        {translate(
                           "dashboard.layout.organization-switcher.add-organization",
                        )}
                     </div>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

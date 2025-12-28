import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { toast } from "@packages/ui/components/sonner";
import { cn } from "@packages/ui/lib/utils";
import { getInitials } from "@packages/utils/text";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Building2, Check, Eye, Plus, Users } from "lucide-react";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { CreateTeamForm } from "@/features/organization/ui/create-team-form";
import { ManageOrganizationForm } from "@/features/organization/ui/manage-organization-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useCredenza } from "@/hooks/use-credenza";
import { useHaptic } from "@/hooks/use-haptic";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

function OrganizationSwitcherErrorFallback() {
   return (
      <div className="p-4 text-center text-destructive text-sm">
         {translate(
            "dashboard.layout.organization-switcher.error.failed-to-load-active",
         )}
      </div>
   );
}

function OrganizationCardSkeleton() {
   return (
      <div className="rounded-xl border bg-card p-4">
         <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="mt-1 h-3 w-24" />
            </div>
         </div>
      </div>
   );
}

interface OrganizationTeamsListProps {
   organizationId: string;
   organizationSlug: string;
   onCreateTeamClick: () => void;
}

function OrganizationTeamsList({
   organizationId,
   organizationSlug,
   onCreateTeamClick,
}: OrganizationTeamsListProps) {
   const trpc = useTRPC();
   const router = useRouter();
   const { closeCredenza } = useCredenza();
   const { trigger: haptic } = useHaptic();

   const { data: teams } = useSuspenseQuery(
      trpc.organization.listTeamsByOrganizationId.queryOptions({
         organizationId,
      }),
   );

   const handleTeamClick = () => {
      haptic("light");
      router.navigate({
         params: { slug: organizationSlug },
         to: "/$slug/organization/teams",
      });
      closeCredenza();
   };

   const handleViewDetails = () => {
      haptic("light");
      router.navigate({
         params: { slug: organizationSlug },
         to: "/$slug/organization",
      });
      closeCredenza();
   };

   const handleCreateTeam = () => {
      haptic("light");
      onCreateTeamClick();
   };

   if (!teams || teams.length === 0) {
      return (
         <div className="ml-8 space-y-2">
            <Button
               className="w-full justify-start gap-2"
               onClick={handleViewDetails}
               variant="ghost"
            >
               <Eye className="size-4" />
               <span>Ver detalhes</span>
            </Button>
            <Separator />
            <Button
               className="w-full justify-start gap-2"
               onClick={handleCreateTeam}
               variant="ghost"
            >
               <Plus className="size-4" />
               <span>
                  {translate(
                     "dashboard.layout.organization-switcher.create-team",
                  )}
               </span>
            </Button>
         </div>
      );
   }

   return (
      <div className="ml-8 space-y-2">
         <Button
            className="w-full justify-start gap-2"
            onClick={handleViewDetails}
            variant="ghost"
         >
            <Eye className="size-4" />
            <span>Ver detalhes</span>
         </Button>
         <Separator />
         <div className="space-y-1">
            {teams.map((team) => (
               <Button
                  className="w-full justify-start gap-2"
                  key={team.id}
                  onClick={handleTeamClick}
                  variant="ghost"
               >
                  <Users className="size-4" />
                  <span className="truncate">{team.name}</span>
               </Button>
            ))}
         </div>
         <Separator />
         <Button
            className="w-full justify-start gap-2"
            onClick={handleCreateTeam}
            variant="ghost"
         >
            <Plus className="size-4" />
            <span>
               {translate("dashboard.layout.organization-switcher.create-team")}
            </span>
         </Button>
      </div>
   );
}

function OrganizationCard({
   organization,
   logo,
   isActive,
   onOrganizationClick,
   onCreateTeamClick,
}: {
   organization: {
      id: string;
      name: string;
      slug: string;
      description?: string;
   };
   logo?: string;
   isActive: boolean;
   onOrganizationClick: (orgId: string, orgSlug: string) => Promise<void>;
   onCreateTeamClick: () => void;
}) {
   const [isExpanded, setIsExpanded] = React.useState(isActive);
   const { trigger: haptic } = useHaptic();

   const handleClick = async () => {
      haptic("light");
      await onOrganizationClick(organization.id, organization.slug);
      setIsExpanded(true);
   };

   return (
      <div className="space-y-2">
         <button
            className={cn(
               "w-full rounded-xl border bg-card p-4 text-left transition-colors",
               "active:bg-accent",
               isActive && "border-primary bg-primary/5",
            )}
            onClick={handleClick}
            type="button"
         >
            <div className="flex items-center gap-3">
               <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-primary text-primary-foreground">
                  {logo ? (
                     <img
                        alt={organization.name}
                        className="size-10 rounded-lg"
                        src={logo}
                     />
                  ) : (
                     <span className="text-sm font-semibold">
                        {getInitials(organization.name)}
                     </span>
                  )}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                     <p className="font-semibold truncate">
                        {organization.name}
                     </p>
                     {isActive && (
                        <Check className="size-4 shrink-0 text-primary" />
                     )}
                  </div>
                  {organization.description && (
                     <p className="text-xs text-muted-foreground truncate">
                        {organization.description}
                     </p>
                  )}
               </div>
            </div>
         </button>
         {isExpanded && (
            <Suspense
               fallback={
                  <div className="ml-8">
                     <Skeleton className="h-8 w-full" />
                  </div>
               }
            >
               <OrganizationTeamsList
                  onCreateTeamClick={onCreateTeamClick}
                  organizationId={organization.id}
                  organizationSlug={organization.slug}
               />
            </Suspense>
         )}
      </div>
   );
}

function OrganizationSwitcherContent() {
   const trpc = useTRPC();
   const router = useRouter();
   const queryClient = useQueryClient();
   const { openSheet } = useSheet();
   const { closeCredenza } = useCredenza();
   const { trigger: haptic } = useHaptic();

   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );

   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   const { data: organizationLimit } = useSuspenseQuery(
      trpc.organization.getOrganizationLimit.queryOptions(),
   );

   const { activeOrganization } = useActiveOrganization();
   const { setActiveOrganization } = useSetActiveOrganization({
      showToast: false,
   });

   const hasReachedLimit =
      (organizations?.length ?? 0) >= (organizationLimit ?? 3);

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

   const handleCreateOrganization = () => {
      haptic("light");
      openSheet({ children: <ManageOrganizationForm /> });
      closeCredenza();
   };

   const handleCreateTeam = () => {
      openSheet({ children: <CreateTeamForm /> });
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Organizações</CredenzaTitle>
         </CredenzaHeader>
         <CredenzaBody className="pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="space-y-4">
               <div className="space-y-3">
                  {organizations?.map((org) => (
                     <OrganizationCard
                        isActive={activeOrganization.slug === org.slug}
                        key={org.id}
                        logo={logo?.data}
                        onCreateTeamClick={handleCreateTeam}
                        onOrganizationClick={handleOrganizationClick}
                        organization={org}
                     />
                  ))}
               </div>

               <Separator />

               <Button
                  className="w-full gap-2"
                  disabled={hasReachedLimit}
                  onClick={handleCreateOrganization}
                  title={
                     hasReachedLimit
                        ? translate(
                             "dashboard.layout.organization-switcher.limit-reached",
                          )
                        : undefined
                  }
                  variant="outline"
               >
                  <Building2 className="size-4" />
                  <span>
                     {translate(
                        "dashboard.layout.organization-switcher.add-organization",
                     )}
                  </span>
               </Button>
            </div>
         </CredenzaBody>
      </>
   );
}

export function OrganizationSwitcherCredenza() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationSwitcherErrorFallback}>
         <Suspense
            fallback={
               <>
                  <CredenzaHeader>
                     <CredenzaTitle>Organizações</CredenzaTitle>
                  </CredenzaHeader>
                  <CredenzaBody className="pb-8">
                     <div className="space-y-3">
                        <OrganizationCardSkeleton />
                        <OrganizationCardSkeleton />
                     </div>
                  </CredenzaBody>
               </>
            }
         >
            <OrganizationSwitcherContent />
         </Suspense>
      </ErrorBoundary>
   );
}
